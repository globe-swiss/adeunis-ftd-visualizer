# LoraViz

Prototype for visualizing data of a [Adeunis FTD network tester](https://www.adeunis.com/en/produit/ftd-network-tester/).

## deploy

```bash
ng build && firebase deploy
```

## serve local

```bash
ng serve -c=local --no-live-reload
```

## Acknowledgements

The code of the payload decoder is based on the story [PAYLOAD DECODER FOR ADEUNIS FIELD TEST DEVICE - TTN MAPPER INTEGRATION](https://www.thethingsnetwork.org/labs/story/payload-decoder-for-adeunis-field-test-device-ttn-mapper-integration) by [SmartBooking](https://www.thethingsnetwork.org/u/SmartBooking)
