// frontend/src/components/admin/ReportGenerator/ReportView.jsx
import React, { useState, useMemo } from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './ReportView.css';

function ReportView({ title, data, error, isLoading, excludeColumns = [] }) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    // Usamos useMemo para ordenar los datos solo cuando cambian los datos originales o la configuración de orden
    const sortedData = useMemo(() => {
        // Asegurarse de que los datos a ordenar sean siempre un array
        const dataToSort = (data && data.items && Array.isArray(data.items)) ? data.items : (Array.isArray(data) ? data : []);
        
        if (dataToSort.length === 0) return [];

        let sortableData = [...dataToSort];
        if (sortConfig.key !== null) {
            sortableData.sort((a, b) => {
                if (a[sortConfig.key] === null) return 1;
                if (b[sortConfig.key] === null) return -1;
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="sort-icon active" />;
        return <FaSortDown className="sort-icon active" />;
    };

    // --- FUNCIÓN DE FORMATO CORREGIDA ---
    const renderCellData = (key, value) => {
        if (value === null || value === undefined) return '---';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';

        if (typeof value === 'number') {
            const lowerCaseKey = key.toLowerCase();
            const currencyKeys = ['precio', 'dinero', 'total', 'ingresos', 'valor'];
            if (currencyKeys.some(k => lowerCaseKey.includes(k))) {
                return `${value.toFixed('')}`;
            }
            if (lowerCaseKey.includes('porcentaje')) {
                return `${value.toFixed(2)} %`;
            }
            return Math.round(value);
        }

        // CORRECCIÓN: Se añade lógica para manejar el objeto de ocupación
        if (typeof value === 'object' && value !== null) {
            if ('total' in value && 'vendidas' in value && 'porcentaje' in value) {
                return `${value.vendidas} de ${value.total} (${value.porcentaje}%)`;
            }
            // Fallback para otros objetos inesperados
            return JSON.stringify(value);
        }
        
        return value;
    };

    const renderData = (reportData) => {
        // Lógica especial para el reporte de Resumen de Ventas
        if (reportData && reportData.items && Array.isArray(reportData.items)) {
            const tableHeaders = Object.keys(reportData.items[0] || {}).filter(header => !excludeColumns.includes(header));
            return (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>{tableHeaders.map(header => <th key={header}>{header.replace(/_/g, ' ').toUpperCase()}</th>)}</tr>
                            </thead>
                            <tbody>
                                {reportData.items.map((item, index) => (
                                    <tr key={index}>
                                        {tableHeaders.map(header => <td key={header}>{renderCellData(header, item[header])}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="report-summary">
                        <h4>Resumen General</h4>
                        <div className="summary-item">
                            <span>Total General de Entradas Vendidas:</span>
                            <strong>{reportData.total_general_vendidas}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Dinero Total Recaudado:</span>
                            <strong>{renderCellData('dinero_total_recaudado_general', reportData.dinero_total_recaudado_general)}</strong>
                        </div>
                    </div>
                </>
            );
        }

        // Lógica para reportes que son un array simple (tabla)
        if (Array.isArray(reportData)) {
            if (reportData.length === 0) return <p>No se encontraron resultados para este reporte.</p>;
            const headers = Object.keys(reportData[0] || {}).filter(header => !excludeColumns.includes(header));
            return (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                {headers.map(header => (
                                    <th key={header} onClick={() => requestSort(header)}>
                                        {header.replace(/_/g, ' ').toUpperCase()} {getSortIcon(header)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((item, index) => (
                                <tr key={index}>
                                    {headers.map(header => <td key={header} data-label={header}>{renderCellData(header, item[header])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        
        // Lógica para reportes que son un solo objeto
        if (typeof reportData === 'object' && reportData !== null) {
            return (
                <ul className="report-single-object-list">
                    {Object.entries(reportData).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>{' '}
                            <span>{renderCellData(key, value)}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        return <p>Formato de datos no soportado.</p>;
    };

    if (isLoading) return <p>Generando reporte...</p>;
    if (error) return <p className="error-message">{`Error al generar reporte: ${error}`}</p>;
    if (data === null || data === undefined) return <p>Selecciona un reporte y haz clic en "Generar".</p>;

    return (
        <div className="report-view-wrapper">
            <h3>{title}</h3>
            {renderData(data)}
        </div>
    );
}

export default ReportView;