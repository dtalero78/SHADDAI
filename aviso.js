/* ─────────────────────────────────────────────────────────────────────────
   Aviso de privacidad · Ley 1581 de 2012
   Puerta previa a cualquier acción que envíe datos del usuario a Shaddai.
   Se usa desde index.html (cotizador y PQRS) y consulta.html (agendamiento).

   Uso:  ShaddaiAviso.pedir(function(){ ...enviar... });   pide autorización
         ShaddaiAviso.exigir(siAcepta, siRechaza);         puerta obligatoria
         ShaddaiAviso.ver();                               solo mostrar el texto

   Es autónomo a propósito: consulta.html no carga el resto del JS del sitio.
   ───────────────────────────────────────────────────────────────────────── */
(function(){
  var CLAVE = 'shaddai:aviso';
  var CORREO = 'administrativo@shaddaiconsultants.com';

  var TEXTO =
    'En cumplimiento de la Ley 1581 de 2012 y demás normas aplicables sobre protección ' +
    'de datos personales, <b>SHADDAI CONSULTANTS S.A.S.</b> informa que será responsable del ' +
    'tratamiento de los datos personales suministrados. La información será utilizada para ' +
    'gestionar solicitudes, PQRSF, atención al cliente, seguimiento de servicios, medición ' +
    'de satisfacción y cumplimiento de obligaciones legales y contractuales. El titular ' +
    'podrá conocer, actualizar, rectificar, suprimir sus datos, revocar la autorización y ' +
    'presentar consultas o reclamos conforme a la normatividad vigente. La Política de ' +
    'Tratamiento de Datos Personales y las solicitudes relacionadas con el manejo de la ' +
    'información podrán consultarse o gestionarse a través del correo: ' +
    '<a href="mailto:' + CORREO + '">' + CORREO + '</a>.';

  var el = null, pendiente = null, rechazo = null, ultimoFoco = null, obligatorio = false;

  /* sessionStorage falla en ventanas privadas y con cookies bloqueadas */
  function leido(){
    try { return sessionStorage.getItem(CLAVE) === '1'; } catch(e){ return false; }
  }
  function guardar(){
    try { sessionStorage.setItem(CLAVE, '1'); } catch(e){}
  }

  function construir(){
    if(el) return el;
    el = document.createElement('div');
    el.className = 'mdl';
    el.id = 'mdlAviso';
    el.style.zIndex = '300';   /* siempre por encima de los demás modales */
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'avisoTitulo');
    el.innerHTML =
      '<div class="mdl-back" data-aviso-cerrar></div>' +
      '<div class="mdl-card" role="document">' +
        '<button type="button" class="mdl-close" data-aviso-cerrar aria-label="Cerrar">' +
          '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<div class="mdl-kicker"><span class="pin"></span><span>Protección de datos personales</span></div>' +
        '<h3 class="display" id="avisoTitulo">Aviso de <em>privacidad</em></h3>' +
        '<p class="mdl-def">' + TEXTO + '</p>' +
        '<div class="aviso-ok">' +
          '<label class="aviso-check">' +
            '<input type="checkbox" id="avisoAcepto">' +
            '<span>Autorizo a Shaddai Consultants S.A.S. el tratamiento de mis datos personales en los términos descritos.</span>' +
          '</label>' +
        '</div>' +
        '<div class="qz-actions">' +
          '<button type="button" class="go" id="avisoSeguir" disabled>' +
            'Continuar' +
            '<svg class="arrow" viewBox="0 0 20 20" fill="none"><path d="M3 10h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" stroke-width="1.6"/></svg>' +
          '</button>' +
          '<button type="button" class="alt" data-aviso-cerrar>Cancelar</button>' +
          '<button type="button" class="alt" id="avisoNo" hidden>No acepto</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('#avisoAcepto').addEventListener('change', function(){
      el.querySelector('#avisoSeguir').disabled = !this.checked;
    });
    el.querySelector('#avisoSeguir').addEventListener('click', function(){
      var cb = pendiente;
      guardar();
      obligatorio = false;
      cerrar();
      if(cb) cb();
    });
    [].slice.call(el.querySelectorAll('[data-aviso-cerrar]')).forEach(function(b){
      b.addEventListener('click', function(){ if(!obligatorio) cerrar(); });
    });
    el.querySelector('#avisoNo').addEventListener('click', function(){
      var no = rechazo;
      obligatorio = false;
      cerrar();
      if(no) no();
    });
    return el;
  }

  function teclado(ev){
    if(ev.key === 'Escape'){ ev.preventDefault(); if(!obligatorio) cerrar(); return; }
    if(ev.key !== 'Tab') return;
    var f = [].slice.call(el.querySelectorAll('button, a[href], input')).filter(function(x){
      return !x.disabled && x.offsetParent !== null;
    });
    if(!f.length) return;
    var pri = f[0], ult = f[f.length - 1];
    if(ev.shiftKey && document.activeElement === pri){ ev.preventDefault(); ult.focus(); }
    else if(!ev.shiftKey && document.activeElement === ult){ ev.preventDefault(); pri.focus(); }
  }

  function abrir(cb, opciones){
    construir();
    opciones = opciones || {};
    obligatorio = !!opciones.obligatorio;
    rechazo = opciones.alRechazar || null;
    pendiente = cb || null;
    /* Sin acción pendiente el aviso es solo de lectura */
    el.querySelector('.aviso-ok').hidden = !cb;
    el.querySelector('#avisoSeguir').hidden = !cb;
    el.querySelector('#avisoSeguir').textContent = obligatorio ? 'Acepto' : 'Continuar';
    /* Obligatorio: sin X, sin cancelar; la única salida es aceptar o rechazar */
    el.querySelector('.mdl-close').hidden = obligatorio;
    el.querySelector('[data-aviso-cerrar].alt').hidden = obligatorio;
    el.querySelector('#avisoNo').hidden = !obligatorio;
    el.querySelector('[data-aviso-cerrar].alt').textContent = cb ? 'Cancelar' : 'Cerrar';
    var chk = el.querySelector('#avisoAcepto');
    chk.checked = false;
    el.querySelector('#avisoSeguir').disabled = true;

    ultimoFoco = document.activeElement;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mdl-abierto');
    el.querySelector('.mdl-card').scrollTop = 0;
    document.addEventListener('keydown', teclado);
    (obligatorio ? chk : el.querySelector('.mdl-close')).focus();
  }

  /* El aviso se abre encima de otros modales: soltar el scroll aquí los
     dejaría con la página desplazándose detrás */
  function otroModalAbierto(){
    return [].slice.call(document.querySelectorAll('.mdl')).some(function(m){
      return m !== el && !m.hidden;
    });
  }

  function cerrar(){
    if(!el) return;
    el.hidden = true;
    pendiente = null;
    rechazo = null;
    obligatorio = false;
    if(!otroModalAbierto()){
      document.body.style.overflow = '';
      document.body.classList.remove('mdl-abierto');
    }
    document.removeEventListener('keydown', teclado);
    if(ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  window.ShaddaiAviso = {
    pedir: function(cb){
      if(leido()){ cb(); return; }   /* una autorización por sesión */
      abrir(cb);
    },
    /* Puerta obligatoria: se entra al formulario solo si acepta */
    exigir: function(siAcepta, siRechaza){
      abrir(siAcepta || function(){}, {obligatorio:true, alRechazar:siRechaza});
    },
    ver: function(){ abrir(null); }
  };

  /* Cualquier enlace marcado abre el aviso en modo lectura */
  document.addEventListener('click', function(ev){
    var a = ev.target.closest && ev.target.closest('[data-aviso]');
    if(a){ ev.preventDefault(); abrir(null); }
  });
})();
