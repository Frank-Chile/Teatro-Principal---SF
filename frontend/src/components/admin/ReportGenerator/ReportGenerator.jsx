// src/components/admin/ReportGenerator/ReportGenerator.jsx
import React, { useState, useEffect } from 'react';
import ReportView from './ReportView';
import {
    getReporteDineroSupera,
    getReporteProtocoloFumadores,
    // Importa las demás funciones de reporte de adminService a medida que las crees
    // getReporteTotalDineroProtocolo,
    // getReporteBalconVendidas,
    // getReportePorcentajePlateaVendidas,
    // getReporteResumenVentasTipo,
    getFuncionesAdmin // Para el selector de funciones
} from '../../../services/adminService';

function ReportGenerator() {
    const [reportTitle, setReportTitle] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [funciones, setFunciones] = useState([]);
    const [selectedFuncionId, setSelectedFuncionId] = useState(''); // Para reportes por función
    const [valorComparacion, setValorComparacion] = useState(100); // Para el reporte de dinero supera

    useEffect(() => {
        // Cargar funciones para el selector (opcional, para reportes por función)
        const fetchFunciones = async () => {
            try {
                const data = await getFuncionesAdmin(false); // Traer todas, no solo activas
                setFunciones(data);
            } catch (err) {
                console.error("Error cargando funciones para selector de reportes:", err);
            }
        };
        fetchFunciones();
    }, []);

    const handleGenerateReport = async (reportType) => {
        setIsLoading(true);
        setError('');
        setReportData(null);
        let data;

        try {
            switch (reportType) {
                case 'dinero_supera':
                    setReportTitle(`Reporte: Dinero Recaudado Supera ${valorComparacion} (Función: ${selectedFuncionId || 'Global'})`);
                    data = await getReporteDineroSupera(valorComparacion, selectedFuncionId || null);
                    break;
                case 'protocolo_vs_fumadores':
                    setReportTitle(`Reporte: Comparación Protocolo vs. Fumadores (Función: ${selectedFuncionId || 'Global'})`);
                    data = await getReporteProtocoloFumadores(selectedFuncionId || null);
                    break;
                // Agrega casos para otros reportes aquí
                // case 'total_dinero_protocolo':
                //     setReportTitle(`Reporte: Total Dinero Protocolo (Función: ${selectedFuncionId || 'Global'})`);
                //     data = await getReporteTotalDineroProtocolo(selectedFuncionId || null);
                //     break;
                // case 'balcon_vendidas':
                //     setReportTitle(`Reporte: Butacas Balcón Vendidas (Función: ${selectedFuncionId || 'Global'})`);
                //     data = await getReporteBalconVendidas(selectedFuncionId || null);
                //     break;
                // case 'porcentaje_platea':
                //     setReportTitle(`Reporte: Porcentaje Platea Vendidas (Función: ${selectedFuncionId || 'Global'})`);
                //     data = await getReportePorcentajePlateaVendidas(selectedFuncionId || null);
                //     break;
                // case 'resumen_ventas_tipo':
                //     setReportTitle(`Reporte: Resumen Ventas por Tipo (Función: ${selectedFuncionId || 'Global'})`);
                //     data = await getReporteResumenVentasTipo(selectedFuncionId || null);
                //     break;
                default:
                    setError('Tipo de reporte no reconocido');
                    setIsLoading(false);
                    return;
            }
            setReportData(data);
        } catch (err) {
            setError(err.detail || err.message || 'Error generando el reporte');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Generador de Reportes</h2>

            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
                <h4>Filtros Comunes (Opcional)</h4>
                <label htmlFor="funcionSelector">Seleccionar Función (para reportes específicos):</label>
                <select
                    id="funcionSelector"
                    value={selectedFuncionId}
                    onChange={(e) => setSelectedFuncionId(e.target.value)}
                    style={{ display: 'block', marginBottom: '10px', width: '100%'}}
                >
                    <option value="">Global (Todas las funciones)</option>
                    {funciones.map(f => (
                        <option key={f.id} value={f.id}>{f.nombre_obra} - {new Date(f.fecha_hora).toLocaleDateString()}</option>
                    ))}
                </select>
            </div>
            
            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>a) Adicionar, actualizar y eliminar butacas al teatro.</h4>
                <p>Esta funcionalidad se realiza a través de "Gestionar Funciones" -&gt; "Butacas".</p>
            </div>


            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>b) Verificar si el total de dinero recaudado por concepto de butacas vendidas supera un valor dado.</h4>
                <label htmlFor="valorComparacion">Valor a superar:</label>
                <input
                    type="number"
                    id="valorComparacion"
                    value={valorComparacion}
                    onChange={(e) => setValorComparacion(parseFloat(e.target.value))}
                    style={{ width: '100px', marginRight: '10px' }}
                />
                <button onClick={() => handleGenerateReport('dinero_supera')}>Generar</button>
            </div>

            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>c) Determinar si se vendieron más butacas de protocolo que de fumadores. (HU6)</h4>
                <button onClick={() => handleGenerateReport('protocolo_vs_fumadores')}>Generar</button>
            </div>

            {/*
            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>d) Determinar el total de dinero recaudado por concepto de butacas de protocolo.</h4>
                <button onClick={() => handleGenerateReport('total_dinero_protocolo')}>Generar</button>
            </div>

            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>e) Listar todas las butacas de balcón que ya han sido vendidas. (HU8)</h4>
                <button onClick={() => handleGenerateReport('balcon_vendidas')}>Generar</button>
            </div>

            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>f) Determinar que porciento representa las butacas de platea vendidas con respecto al total de butacas de platea. (HU9)</h4>
                <button onClick={() => handleGenerateReport('porcentaje_platea')}>Generar</button>
            </div>

            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                <h4>(Extra) Resumen de ventas por tipo de butaca. (HU12)</h4>
                <button onClick={() => handleGenerateReport('resumen_ventas_tipo')}>Generar</button>
            </div>
            */}

            { (isLoading || error || reportData) && (
                 <ReportView title={reportTitle} data={reportData} error={error} isLoading={isLoading} />
            )}
        </div>
    );
}

export default ReportGenerator;