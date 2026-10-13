// The smallest script that answers the only question this leg can currently ask: can k6 load the generated
// client at all? It imports one client and prints one line. It deliberately does not exercise any operation —
// there is nothing to exercise until the module loads, and a probe that tried would obscure the load error with
// its own.
//
// `clients/pets-client.js` and not the `clients.js` barrel: the barrel re-exports through its own extensionless
// specifiers, so importing it would fail one level earlier and the recorded error would name the barrel rather
// than the import that actually cannot be resolved.
import { PetsClient } from '/tree/clients/pets-client.js';

export const options = { vus: 1, iterations: 1 };

export default function () {
  console.log(`GOAST-K6-LOADED typeof PetsClient=${typeof PetsClient}`);
}
