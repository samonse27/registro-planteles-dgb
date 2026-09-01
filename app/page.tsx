"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, MapPin, Plus, Search, Send, Trash2, X } from "lucide-react";
import { ESTADOS, MUNICIPIOS_POR_ESTADO } from "@/lib/catalogos";

type Plantel = {
  id: string; nombre: string; direccion: string; latitud: string; longitud: string;
  linkGoogleMaps: string; aulasDidacticas: string; capacidadPorAula: string;
  computadoras: string; codigoPostal: string; capacidadMaximaPlantel: string;
  capacidadInstalada: string; banos: boolean | null; espacioAdministrativo: boolean | null;
  agua: boolean | null; luz: boolean | null; internet: boolean | null;
  drenaje: boolean | null; equipoComputo: boolean | null; laboratorio: boolean | null;
  movilidad: string; horario: string;
};

const nuevoPlantel = (): Plantel => ({
  id: crypto.randomUUID(), nombre: "", direccion: "", latitud: "", longitud: "",
  linkGoogleMaps: "", aulasDidacticas: "", capacidadPorAula: "", computadoras: "",
  codigoPostal: "", capacidadMaximaPlantel: "", capacidadInstalada: "",
  banos: null, espacioAdministrativo: null,
  agua: null, luz: null, internet: null, drenaje: null, equipoComputo: null,
  laboratorio: null, movilidad: "", horario: "",
});

const PASOS = ["Responsable", "Municipios", "Planteles", "Revisión"];

export default function Home() {
  const [paso, setPaso] = useState(0);
  const [nombreResponsable, setNombreResponsable] = useState("");
  const [correoResponsable, setCorreoResponsable] = useState("");
  const [estado, setEstado] = useState("");
  const [busquedaMunicipio, setBusquedaMunicipio] = useState("");
  const [planteles, setPlanteles] = useState<Record<string, Plantel[]>>({});
  const [municipioActivo, setMunicipioActivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [finalizado, setFinalizado] = useState(false);

  const opcionesMunicipios = useMemo(() => MUNICIPIOS_POR_ESTADO[estado] ?? [], [estado]);
  const municipios = useMemo(() => Object.keys(planteles), [planteles]);
  const municipiosFiltrados = useMemo(() => {
    const consulta = busquedaMunicipio.trim().toLocaleLowerCase("es-MX");
    if (!consulta) return opcionesMunicipios;
    return opcionesMunicipios.filter((municipio) =>
      municipio.toLocaleLowerCase("es-MX").includes(consulta),
    );
  }, [busquedaMunicipio, opcionesMunicipios]);
  const cantidadPlanteles = Object.values(planteles).reduce((total, lista) => total + lista.length, 0);

  const elegirEstado = (clave: string) => {
    setEstado(clave); setPlanteles({}); setMunicipioActivo(""); setBusquedaMunicipio("");
  };

  const alternarMunicipio = (municipio: string) => {
    setPlanteles((actuales) => {
      const copia = { ...actuales };
      if (Object.hasOwn(copia, municipio)) delete copia[municipio];
      else copia[municipio] = [nuevoPlantel()];
      return copia;
    });
  };

  const actualizarPlantel = <K extends keyof Plantel>(municipio: string, id: string, campo: K, valor: Plantel[K]) => {
    setPlanteles((actuales) => ({
      ...actuales,
      [municipio]: actuales[municipio].map((plantel) => plantel.id === id ? { ...plantel, [campo]: valor } : plantel),
    }));
  };

  const agregarPlantel = (municipio: string) => setPlanteles((actuales) => ({
    ...actuales, [municipio]: [...(actuales[municipio] ?? []), nuevoPlantel()],
  }));

  const eliminarPlantel = (municipio: string, id: string) => setPlanteles((actuales) => ({
    ...actuales, [municipio]: actuales[municipio].filter((plantel) => plantel.id !== id),
  }));

  const plantelCompleto = (plantel: Plantel) => Boolean(
    plantel.nombre.trim() && plantel.direccion.trim() && plantel.latitud.trim() &&
    plantel.longitud.trim() && /^[0-9]{5}$/.test(plantel.codigoPostal) &&
    plantel.linkGoogleMaps.trim() && plantel.capacidadMaximaPlantel !== "" &&
    plantel.capacidadInstalada !== "" && plantel.aulasDidacticas !== "" &&
    plantel.capacidadPorAula !== "" && plantel.computadoras !== "" &&
    plantel.movilidad.trim() && plantel.horario.trim() &&
    plantel.agua !== null && plantel.luz !== null && plantel.internet !== null &&
    plantel.drenaje !== null && plantel.equipoComputo !== null &&
    plantel.laboratorio !== null && plantel.banos !== null &&
    plantel.espacioAdministrativo !== null
  );

  const municipioCompleto = (municipio: string) =>
    Boolean(planteles[municipio]?.length > 0 && planteles[municipio].every(plantelCompleto));

  const puedeContinuar = () => {
    if (paso === 0) return nombreResponsable.trim() && correoResponsable.includes("@");
    if (paso === 1) return estado && municipios.length > 0;
    if (paso === 2) return municipioActivo && municipioCompleto(municipioActivo);
    return true;
  };

  const avanzar = () => {
    setMensaje("");
    if (!puedeContinuar()) { setMensaje("Complete los campos obligatorios antes de continuar."); return; }
    if (paso === 1) {
      if (!municipioActivo) setMunicipioActivo(municipios[0]);
      setPaso(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (paso === 2) {
      const indiceActual = municipios.indexOf(municipioActivo);
      if (indiceActual < municipios.length - 1) {
        setMunicipioActivo(municipios[indiceActual + 1]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const municipioIncompleto = municipios.find((municipio) => !municipioCompleto(municipio));
      if (municipioIncompleto) {
        setMunicipioActivo(municipioIncompleto);
        setMensaje(`Complete la información de ${municipioIncompleto} antes de revisar el registro.`);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setPaso((actual) => Math.min(actual + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enviar = async () => {
    if (paso !== 3) return;
    setEnviando(true); setMensaje("");
    try {
      const respuesta = await fetch("/api/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreResponsable, correoResponsable,
          estado: ESTADOS.find((item) => item.clave === estado),
          municipios: municipios.map((municipio) => ({
            clave: String(opcionesMunicipios.indexOf(municipio) + 1).padStart(3, "0"),
            nombre: municipio,
            planteles: planteles[municipio].map((plantel) => ({
              nombrePlantel: plantel.nombre,
              direccionPlantel: plantel.direccion,
              latitud: plantel.latitud,
              longitud: plantel.longitud,
              codigoPostal: plantel.codigoPostal,
              linkGoogleMaps: plantel.linkGoogleMaps,
              capacidadMaximaPlantel: Number(plantel.capacidadMaximaPlantel),
              capacidadInstalada: Number(plantel.capacidadInstalada),
              aulasDidacticas: Number(plantel.aulasDidacticas),
              capacidadPorAula: Number(plantel.capacidadPorAula),
              computadoras: Number(plantel.computadoras),
              agua: plantel.agua,
              luz: plantel.luz,
              internet: plantel.internet,
              drenaje: plantel.drenaje,
              equipoComputo: plantel.equipoComputo,
              laboratorio: plantel.laboratorio,
              banos: plantel.banos,
              espacioAdministrativo: plantel.espacioAdministrativo,
              movilidad: plantel.movilidad,
              horario: plantel.horario,
            })),
          })),
          fechaRegistro: new Date().toISOString(),
        }),
      });
      if (!respuesta.ok) throw new Error("No se pudo enviar el registro. La conexión aún no está configurada.");
      setFinalizado(true);
    } catch (error) { setMensaje(error instanceof Error ? error.message : "Ocurrió un error inesperado."); }
    finally { setEnviando(false); }
  };

  if (finalizado) return (
    <main className="app-shell screen-pattern flex min-h-screen items-center justify-center p-5">
      <style>{`.screen-pattern{background:#5b1029 url('/fondo-guinda.png') center/cover no-repeat fixed !important;}`}</style>
      <section className="glass-card max-w-xl text-center">
        <div className="success-icon"><CheckCircle2 size={38} /></div>
        <p className="eyebrow">Registro concluido</p><h1>¡Muchas gracias!</h1>
        <p className="lead">La información de sus planteles fue enviada correctamente.</p>
        <div className="folio-box">Planteles registrados: <strong>{cantidadPlanteles}</strong></div>
      </section>
    </main>
  );

  return (
    <main className="app-shell screen-pattern min-h-screen px-4 py-8 md:px-8">
      <style>{`.screen-pattern{background:#5b1029 url('/fondo-guinda.png') center/cover no-repeat fixed !important;}`}</style>
      <div className="app-content">
        <header className="brand-header">
          <div className="brand-mark"><Building2 size={25} /></div>
          <div><p className="eyebrow">Dirección General de Bachillerato</p><h1>Registro de planteles</h1></div>
        </header>
        <section className="form-card">
          <nav className="steps" aria-label="Progreso del formulario">
            {PASOS.map((nombre, indice) => <div className={`step ${indice === paso ? "active" : ""} ${indice < paso ? "done" : ""}`} key={nombre}><span>{indice < paso ? <Check size={15} /> : indice + 1}</span><small>{nombre}</small></div>)}
          </nav>
          <form onSubmit={(event) => event.preventDefault()}>
            {paso === 0 && <section className="panel narrow-panel">
              <p className="eyebrow">Paso 1 de 4</p><h2>Datos de la persona responsable</h2>
              <p className="section-copy">Usaremos estos datos únicamente para identificar el registro.</p>
              <label>Nombre completo <b>*</b><input required value={nombreResponsable} onChange={(e) => setNombreResponsable(e.target.value)} placeholder="Ej. Juan Torres" autoComplete="name" /></label>
              <label>Correo electrónico <b>*</b><input required type="email" value={correoResponsable} onChange={(e) => setCorreoResponsable(e.target.value)} placeholder="nombre@dgb.sems.gob.mx" autoComplete="email" /></label>
            </section>}

            {paso === 1 && <section className="panel">
              <p className="eyebrow">Paso 2 de 4</p><h2>Seleccione estado y municipios</h2>
              <div className="two-columns">
                <label>Estado <b>*</b><select required value={estado} onChange={(e) => elegirEstado(e.target.value)}><option value="">Seleccione un estado</option>{ESTADOS.map((item) => <option key={item.clave} value={item.clave}>{item.nombre}</option>)}</select></label>
                <div><span className="field-title">Municipios seleccionados</span><div className={`selection-summary ${municipios.length === 0 ? "empty" : ""}`}>{municipios.length === 0 ? "0 seleccionados" : `${municipios.length} seleccionado${municipios.length === 1 ? "" : "s"}`}</div></div>
              </div>
              {estado && <>
                <div className="municipality-toolbar">
                  <div className="municipality-search"><Search size={17} /><input value={busquedaMunicipio} onChange={(e) => setBusquedaMunicipio(e.target.value)} placeholder="Buscar municipio…" aria-label="Buscar municipio" /></div>
                  <span>Mostrando {municipiosFiltrados.length} de {opcionesMunicipios.length}</span>
                </div>
                <div className="municipality-grid">{municipiosFiltrados.map((municipio) => <button type="button" key={municipio} aria-pressed={municipios.includes(municipio)} onClick={() => alternarMunicipio(municipio)} className={municipios.includes(municipio) ? "selected" : ""}><span className="check-box">{municipios.includes(municipio) && <Check size={14} />}</span>{municipio}</button>)}</div>
                {municipios.length > 0 && <div className="selected-municipalities"><span>Selección actual:</span>{municipios.map((municipio) => <button type="button" key={municipio} onClick={() => alternarMunicipio(municipio)} aria-label={`Quitar ${municipio}`}>{municipio}<X size={14} /></button>)}</div>}
              </>}
            </section>}

            {paso === 2 && <section className="panel">
              <p className="eyebrow">Paso 3 de 4</p><h2>Capture los planteles</h2>
              <p className="section-copy">Puede agregar más de un plantel en cada municipio. Al continuar avanzará al siguiente municipio seleccionado.</p>
              <p className="municipality-progress">Municipio {municipios.indexOf(municipioActivo) + 1} de {municipios.length}</p>
              <div className="municipality-tabs">{municipios.map((municipio) => <button type="button" key={municipio} className={municipioActivo === municipio ? "active" : ""} onClick={() => setMunicipioActivo(municipio)}><MapPin size={15} /> {municipio} <small>{planteles[municipio]?.length ?? 0}</small></button>)}</div>
              {municipioActivo && planteles[municipioActivo]?.map((plantel, indice) => <article className="plant-card" key={plantel.id}>
                <div className="plant-card-header"><h3>Plantel {indice + 1} en {municipioActivo}</h3>{planteles[municipioActivo].length > 1 && <button type="button" className="icon-danger" onClick={() => eliminarPlantel(municipioActivo, plantel.id)} aria-label="Eliminar plantel"><Trash2 size={17} /></button>}</div>
                <div className="field-grid">
                  <label>Nombre del plantel <b>*</b><input required value={plantel.nombre} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "nombre", e.target.value)} /></label>
                  <label>Dirección del plantel <b>*</b><input required value={plantel.direccion} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "direccion", e.target.value)} /></label>
                  <label>Latitud <b>*</b><input required value={plantel.latitud} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "latitud", e.target.value)} placeholder="Ej. 19.432608" /></label>
                  <label>Longitud <b>*</b><input required value={plantel.longitud} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "longitud", e.target.value)} placeholder="Ej. -99.133209" /></label>
                  <label>Código Postal <b>*</b><input required inputMode="numeric" maxLength={5} pattern="[0-9]{5}" value={plantel.codigoPostal} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "codigoPostal", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Ej. 06000" /></label>
                  <label className="wide">Enlace de Google Maps <b>*</b><input required type="url" value={plantel.linkGoogleMaps} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "linkGoogleMaps", e.target.value)} placeholder="https://maps.google.com/..." /></label>
                  <label>Capacidad máxima en plantel <b>*</b><input required type="number" min="0" step="1" value={plantel.capacidadMaximaPlantel} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "capacidadMaximaPlantel", e.target.value)} placeholder="Ej. 600" /></label>
                  <label>Capacidad instalada <b>*</b><input required type="number" min="0" step="1" value={plantel.capacidadInstalada} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "capacidadInstalada", e.target.value)} placeholder="Ej. 450" /></label>
                  <label>Aulas didácticas <b>*</b><input required type="number" min="0" value={plantel.aulasDidacticas} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "aulasDidacticas", e.target.value)} placeholder="Ej. 12" /></label>
                  <label>Capacidad por aula <b>*</b><input required type="number" min="0" value={plantel.capacidadPorAula} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "capacidadPorAula", e.target.value)} placeholder="Ej. 30" /></label>
                  <label>Computadoras <b>*</b><input required type="number" min="0" value={plantel.computadoras} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "computadoras", e.target.value)} placeholder="Ej. 25" /></label>
                  <label>Movilidad <b>*</b><input required value={plantel.movilidad} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "movilidad", e.target.value)} placeholder="Ej. transporte público" /></label>
                  <label>Horario <b>*</b><input required value={plantel.horario} onChange={(e) => actualizarPlantel(municipioActivo, plantel.id, "horario", e.target.value)} placeholder="Ej. 08:00 a 18:00" /></label>
                </div>
                <div className="switch-grid">{([['agua','Agua'],['luz','Luz'],['internet','Internet'],['drenaje','Drenaje'],['equipoComputo','Equipo de cómputo'],['laboratorio','Laboratorio'],['banos','Baños'],['espacioAdministrativo','Espacio administrativo']] as const).map(([campo, etiqueta]) => <fieldset className="boolean-field" key={campo}><legend>{etiqueta} <b>*</b></legend><div className="yes-no-options"><button type="button" className={plantel[campo] === true ? "selected" : ""} aria-pressed={plantel[campo] === true} onClick={() => actualizarPlantel(municipioActivo, plantel.id, campo, true)}>Sí</button><button type="button" className={plantel[campo] === false ? "selected" : ""} aria-pressed={plantel[campo] === false} onClick={() => actualizarPlantel(municipioActivo, plantel.id, campo, false)}>No</button></div></fieldset>)}</div>
              </article>)}
              {municipioActivo && <button type="button" className="add-button" onClick={() => agregarPlantel(municipioActivo)}><Plus size={17} /> Agregar otro plantel en {municipioActivo}</button>}
            </section>}

            {paso === 3 && <section className="panel">
              <p className="eyebrow">Paso 4 de 4</p><h2>Revisión del registro</h2>
              <p className="section-copy">Verifique la información antes de enviarla.</p>
              <div className="review-contact"><strong>{nombreResponsable}</strong><span>{correoResponsable}</span><span>{ESTADOS.find((item) => item.clave === estado)?.nombre}</span></div>
              <div className="review-list">{municipios.map((municipio) => <article key={municipio}><div><MapPin size={18} /><strong>{municipio}</strong></div><span>{planteles[municipio]?.length ?? 0} plantel(es)</span></article>)}</div>
              <div className="review-total">Total de planteles <strong>{cantidadPlanteles}</strong></div>
            </section>}

            {mensaje && <div className="error-message" role="alert">{mensaje}</div>}
            <footer className="form-actions">
              {paso > 0 && <button type="button" className="secondary-button" onClick={() => setPaso((actual) => actual - 1)}><ArrowLeft size={17} /> Regresar</button>}
              <div className="spacer" />
              {paso < 3 ? <button key="continuar" type="button" className="primary-button" onClick={avanzar}>{paso === 2 ? (municipios.indexOf(municipioActivo) < municipios.length - 1 ? "Siguiente municipio" : "Revisar registro") : "Continuar"} <ArrowRight size={17} /></button> : <button key="enviar" type="button" className="primary-button" onClick={enviar} disabled={enviando}>{enviando ? "Enviando…" : <><Send size={17} /> Enviar registro</>}</button>}
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}
