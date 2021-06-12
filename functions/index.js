/* eslint-disable */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

exports.decodeAdeunisFTDPayload = functions
  .region("europe-west6")
  .https.onRequest(async (req, res) => {
    const uplink_data = req.body.DevEUI_uplink;
    try {
      const payload_raw_bytes = Buffer.from(uplink_data.payload_hex, "hex");
      uplink_data.payload_decoded = decodePayload(payload_raw_bytes);
      functions.logger.info("received data for " + uplink_data.DevEUI, uplink_data);

      await db.collection("raw").doc().set(uplink_data);

      if (uplink_data.payload_decoded.latitude) {
        const today = new Date().toISOString().substring(0, 10);
        await db
          .collection("data")
          .doc(uplink_data.DevEUI + "_" + today)
          .set(
            {
              date: today,
              deveui: uplink_data.DevEUI,
              payloads: admin.firestore.FieldValue.arrayUnion({
                ts: uplink_data.Time,
                lng: uplink_data.payload_decoded.longitude,
                lat: uplink_data.payload_decoded.latitude,
                rssi: uplink_data.payload_decoded.rssi_dl,
                snr: uplink_data.payload_decoded.snr_dl,
              }),
            },
            { merge: true }
          );
      } else {
        functions.logger.warn(
          "No GPS coordinates received for " + uplink_data.DevEUI
        );
      }
    } catch (e) {
      functions.logger.error(e, uplink_data);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  });

function decodePayload(bytes) {
  function parseCoordinate(raw_value, coordinate) {
    var raw_itude = raw_value;
    var temp = "";

    var itude_string = ((raw_itude >> 28) & 0xf).toString();
    raw_itude <<= 4;

    itude_string += ((raw_itude >> 28) & 0xf).toString();
    raw_itude <<= 4;

    coordinate.degrees += itude_string;
    itude_string += "°";

    temp = ((raw_itude >> 28) & 0xf).toString();
    raw_itude <<= 4;

    temp += ((raw_itude >> 28) & 0xf).toString();
    raw_itude <<= 4;

    itude_string += temp;
    itude_string += ".";

    coordinate.minutes += temp;

    temp = ((raw_itude >> 28) & 0xf).toString();
    raw_itude <<= 4;

    temp += ((raw_itude >> 28) & 0xf).toString();
    raw_itude <<= 4;

    itude_string += temp;
    coordinate.minutes += ".";
    coordinate.minutes += temp;

    return itude_string;
  }

  function parseLatitude(raw_latitude, coordinate) {
    var latitude = parseCoordinate(raw_latitude, coordinate);
    latitude += ((raw_latitude & 0xf0) >> 4).toString();
    coordinate.minutes += ((raw_latitude & 0xf0) >> 4).toString();

    return latitude;
  }

  function parseLongitude(raw_longitude, coordinate) {
    var longitude = ((raw_longitude >> 28) & 0xf).toString();
    coordinate.degrees = longitude;
    longitude += parseCoordinate(raw_longitude << 4, coordinate);

    return longitude;
  }

  function addField(field_no, payload) {
    switch (field_no) {
      case 0:
        payload.temperature = bytes[bytes_pos_] & 0x7f;

        if ((bytes[bytes_pos_] & 0x80) > 0) {
          payload.temperature -= 128;
        }

        bytes_pos_++;
        break;

      case 1:
        payload.trigger = "accelerometer";
        break;

      case 2:
        payload.trigger = "pushbutton";
        break;

      case 3:
        var coordinate = {};
        coordinate.degrees = "";
        coordinate.minutes = "";

        var raw_value = 0;
        raw_value |= bytes[bytes_pos_++] << 24;
        raw_value |= bytes[bytes_pos_++] << 16;
        raw_value |= bytes[bytes_pos_++] << 8;
        raw_value |= bytes[bytes_pos_++];

        payload.lati_hemisphere = (raw_value & 1) == 1 ? "South" : "North";
        payload.latitude_dmm = payload.lati_hemisphere.charAt(0) + " ";
        payload.latitude_dmm += parseLatitude(raw_value, coordinate);
        payload.latitude =
          (parseFloat(coordinate.degrees) +
            parseFloat(coordinate.minutes) / 60) *
          ((raw_value & 1) == 1 ? -1.0 : 1.0);

        coordinate.degrees = "";
        coordinate.minutes = "";

        raw_value = 0;
        raw_value |= bytes[bytes_pos_++] << 24;
        raw_value |= bytes[bytes_pos_++] << 16;
        raw_value |= bytes[bytes_pos_++] << 8;
        raw_value |= bytes[bytes_pos_++];

        payload.long_hemisphere = (raw_value & 1) == 1 ? "West" : "East";
        payload.longitude_dmm = payload.long_hemisphere.charAt(0) + " ";
        payload.longitude_dmm += parseLongitude(raw_value, coordinate);
        payload.longitude =
          (parseFloat(coordinate.degrees) +
            parseFloat(coordinate.minutes) / 60) *
          ((raw_value & 1) == 1 ? -1.0 : 1.0);

        raw_value = bytes[bytes_pos_++];
        switch ((raw_value & 0xf0) >> 4) {
          case 1:
            payload.gps_quality = "Good";
            break;

          case 2:
            payload.gps_quality = "Average";
            break;

          case 3:
            payload.gps_quality = "Poor";
            break;

          default:
            payload.gps_quality = (raw_value >> 4) & 0xf;
            break;
        }

        payload.hdop = (raw_value >> 4) & 0xf;
        payload.sats = raw_value & 0xf;

        break;

      case 4:
        payload.ul_counter = bytes[bytes_pos_++];
        break;

      case 5:
        payload.dl_counter = bytes[bytes_pos_++];
        break;

      case 6:
        payload.battery_level = bytes[bytes_pos_++] << 8;
        payload.battery_level |= bytes[bytes_pos_++];
        break;

      case 7:
        payload.rssi_dl = bytes[bytes_pos_++];
        payload.rssi_dl *= -1;
        payload.snr_dl = bytes[bytes_pos_] & 0x7f;

        if ((bytes[bytes_pos_] & 0x80) > 0) {
          payload.snr_dl -= 128;
        }

        bytes_pos_++;
        break;

      default:
        break;
    }
  }

  var status_ = bytes[0];
  var bytes_len_ = bytes.length;
  var bytes_pos_ = 1;
  var i = 0;
  var payload = {};

  var temp_hex_str = "";
  payload.payload = "";

  for (var j = 0; j < bytes_len_; j++) {
    temp_hex_str = bytes[j].toString(16).toUpperCase();

    if (temp_hex_str.length == 1) {
      temp_hex_str = "0" + temp_hex_str;
    }

    payload.payload += temp_hex_str;
  }

  do {
    if ((status_ & 0x80) > 0) {
      addField(i, payload);
    }

    i++;
  } while (((status_ <<= 1) & 0xff) > 0);

  return payload;
}
