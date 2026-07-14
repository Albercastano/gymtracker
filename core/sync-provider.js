"use strict";
(function(){
  class NoSyncProvider{
    constructor(){this.id='none';this.enabled=false;this.status='disabled'}
    getCapabilities(){return Object.freeze({login:false,upload:false,download:false,devices:false,deleteRemote:false})}
    async connect(){throw new Error('Phoenix Vault no está habilitado en esta versión')}
    async upload(){throw new Error('Sincronización desactivada')}
    async download(){throw new Error('Sincronización desactivada')}
    async listDevices(){return []}
    async deleteRemote(){throw new Error('No existe almacenamiento remoto activo')}
  }
  const provider=new NoSyncProvider();
  window.PhoenixSync=Object.freeze({provider,getStatus:()=>Object.freeze({provider:provider.id,enabled:false,status:provider.status,localFirst:true})});
})();
