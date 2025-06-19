// src/components/admin/ReportGenerator/ReportView.jsx
import React from 'react';

function ReportView({ title, data, error, isLoading }) {
    if (isLoading) return <p>Generando reporte...</p>;
    if (error) return <p className="error-message">Error al generar reporte: {error}</p>;
    if (!data) return <p>No hay datos para mostrar para este reporte.</p>;

    // Función para renderizar datos de forma genérica
    const renderData = (reportData) => {
        if (typeof reportData === 'boolean') {
            return <p>{reportData ? 'Sí' : 'No'}</p>;
        }
        if (typeof reportData === 'number' || typeof reportData === 'string') {
            return <p>{reportData}</p>;
        }
        if (Array.isArray(reportData)) {
            if (reportData.length === 0) return <p>No hay resultados.</p>;
            // Asumimos que es una lista de objetos y tomamos las claves del primero para las cabeceras
            const headers = Object.keys(reportData[0] || {});
            return (
                <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {headers.map(header => <th key={header} style={tableHeaderStyle}>{header.replace(/_/g, ' ').toUpperCase()}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, index) => (
                            <tr key={index}>
                                {headers.map(header => <td key={header} style={tableCellStyle}>{renderCellData(item[header])}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        if (typeof reportData === 'object' && reportData !== null) {
            return (
                <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {Object.entries(reportData).map(([key, value]) => (
                        <li key={key} style={{ marginBottom: '8px', padding: '5px', border: '1px solid #eee' }}>
                            <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {renderCellData(value)}
                        </li>
                    ))}
                </ul>
            );
        }
        return <p>Formato de datos no soportado para visualización.</p>;
    };

    const renderCellData = (cellValue) => {
        if (typeof cellValue === 'boolean') return cellValue ? 'Sí' : 'No';
        if (typeof cellValue === 'number' && !isNaN(cellValue)) return cellValue.toFixed(2); // Formatear números
        if (Array.isArray(cellValue)) return cellValue.join(', '); // Simple join para arrays en celdas
        if (typeof cellValue === 'object' && cellValue !== null) return JSON.stringify(cellValue); // Stringify objetos en celdas
        return cellValue;
    }


    return (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px' }}>
            <h4>{title}</h4>
            {renderData(data)}
        </div>
    );
}

const tableHeaderStyle = {
    border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2'
};
const tableCellStyle = {
    border: '1px solid #ddd', padding: '8px', textAlign: 'left'
};

export default ReportView;