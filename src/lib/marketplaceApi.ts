import { api } from './api';
export async function loadAdminData(){const [dashboard,merchants,stores,orders]=await Promise.all([api.dashboard(),api.merchants(),api.stores(),api.orders()]);return{dashboard,merchants,stores,orders};}
export async function loadMerchantContext(){return api.me();}
export async function updateMerchant(id:string,status:'active'|'suspended'){return api.merchantStatus(id,status);}
export async function updateOrder(id:string,status:string){return api.orderStatus(id,status);}
