import type { Contact } from './contact';
import type { Pet } from './pet';

export type Owner = {
    id: string;
    name: string;
    contact?: Contact;
    pet?: Pet;
  };
