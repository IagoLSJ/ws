import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './app/router';
import { vPermission } from './shared/directives/v-permission';
import './assets/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive('permission', vPermission);

app.mount('#app');
