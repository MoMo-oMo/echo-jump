import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// createVuetify({}) alone doesn't register any components — Vuetify needs
// either a build-time auto-import plugin (not set up for this Vue CLI /
// webpack project) or, as here, its components and directives passed in
// explicitly. Without this every <v-btn>, <v-app>, <v-container>, etc.
// fails to resolve and falls back to an unstyled custom element.
const vuetify = createVuetify({
  components,
  directives,
});

export default vuetify;
