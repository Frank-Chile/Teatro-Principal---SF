// frontend/src/components/admin/ReportGenerator/ReportGenerator.jsx
import React, { useState, useEffect } from 'react';
import ReportView from './ReportView';
import {
    getReporteAnalisisOcupacion,
    getReporteComparacionProtocoloFumadores,
    getReporteDineroSupera,
    getReporteResumenVentasTipo,
    getReporteTodasButacasVendidas,
    getFuncionesAdmin
} from '../../../services/adminService';
import { FaFileDownload } from 'react-icons/fa';
import './ReportGenerator.css';

// Opciones finales para el menú desplegable, basadas en las Historias de Usuario
const reportOptions = [
    { key: 'resumen_ventas', label: 'Resumen de Ventas por Tipo' },
    { key: 'analisis_ocupacion', label: 'Análisis de Ocupación' },
    { key: 'comparar_protocolo_fumadores', label: 'Comparar Ventas: Protocolo vs Fumadores' },
    { key: 'todas_butacas_vendidas', label: 'Listar Todas las Butacas Vendidas' },
    { key: 'dinero_supera', label: 'Verificar si Ingresos Superan Valor' },
];

function ReportGenerator() {
    const [selectedReport, setSelectedReport] = useState(reportOptions[0].key);
    const [reportTitle, setReportTitle] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [funciones, setFunciones] = useState([]);
    const [selectedFuncionId, setSelectedFuncionId] = useState('');
    const [valorComparacion, setValorComparacion] = useState(1000);

    useEffect(() => {
        const fetchFunciones = async () => {
            try {
                const data = await getFuncionesAdmin();
                setFunciones(data);
            } catch (err) {
                console.error("Error cargando funciones para selector de reportes:", err);
            }
        };
        fetchFunciones();
    }, []);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError('');
        setReportData(null);
        
        const selectedOption = reportOptions.find(opt => opt.key === selectedReport);
        const selectedLabel = selectedOption?.label || '';
        const funcionLabel = selectedFuncionId ? funciones.find(f=>f.id === selectedFuncionId)?.nombre_obra : 'Global';
        setReportTitle(`${selectedLabel} - (${funcionLabel})`);

        let data;
        const funcionId = selectedFuncionId || null;

        try {
            // El switch ahora llama a la función de servicio correcta para cada reporte
            switch (selectedReport) {
                case 'resumen_ventas':
                    data = await getReporteResumenVentasTipo(funcionId);
                    break;
                case 'analisis_ocupacion':
                    data = await getReporteAnalisisOcupacion(funcionId);
                    break;
                case 'comparar_protocolo_fumadores':
                    data = await getReporteComparacionProtocoloFumadores(funcionId);
                    break;
                case 'todas_butacas_vendidas':
                    data = await getReporteTodasButacasVendidas(funcionId);
                    break;
                case 'dinero_supera':
                    data = await getReporteDineroSupera(valorComparacion, funcionId);
                    break;
                default:
                    throw new Error('Tipo de reporte no reconocido');
            }
            setReportData(data);
        } catch (err) {
            setError(err.detail || err.message || 'Error generando el reporte');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <h2>Generador de Reportes</h2>
            </div>
            
            <div className="report-controls">
                <div className="control-group">
                    <label htmlFor="reportSelector">Seleccionar Reporte</label>
                    <select id="reportSelector" value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
                        {reportOptions.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                
                <div className="control-group">
                    <label htmlFor="funcionSelector">Filtrar por Función (Opcional)</label>
                    <select id="funcionSelector" value={selectedFuncionId} onChange={(e) => setSelectedFuncionId(e.target.value)}>
                        <option value="">Global (Todas las funciones)</option>
                        {funciones.map(f => (
                            <option key={f.id} value={f.id}>{f.nombre_obra} - {new Date(f.fecha_hora).toLocaleDateString()}</option>
                        ))}
                    </select>
                </div>

                {selectedReport === 'dinero_supera' && (
                    <div className="control-group">
                        <label htmlFor="valorComparacion">Valor a Superar</label>
                        <input
                            type="number"
                            id="valorComparacion"
                            className="no-spinners"
                            value={valorComparacion}
                            onChange={(e) => setValorComparacion(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                )}
                
                <button onClick={handleGenerateReport} disabled={isLoading} className="action-button primary generate-btn">
                    <FaFileDownload />
                    <span>{isLoading ? 'Generando...' : 'Generar Reporte'}</span>
                </button>
            </div>

            <div className="report-view-wrapper">
                <ReportView
                    title={reportTitle}
                    data={reportData}
                    error={error}
                    isLoading={isLoading}
                    excludeColumns={selectedReport === 'todas_butacas_vendidas' ? ['id', 'seccion', 'precio_base_calculado', 'tipo_butaca', 'es_protocolo', 'es_fumadores'] : []}
                />
            </div>
        </div>
    );
}

export default ReportGenerator;