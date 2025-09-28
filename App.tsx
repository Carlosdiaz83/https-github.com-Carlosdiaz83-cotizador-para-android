
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_PRICING_DATA } from './constants';
import { updatePricesFromImage } from './services/geminiService';
import { PricingData, PlanKey, AgeRangeKey } from './types';
import { LogoIcon, SpinnerIcon } from './components/Icons';

const Header: React.FC = () => (
    <header className="w-full bg-white shadow-md p-4 flex items-center justify-center space-x-3">
        <LogoIcon />
        <div>
            <h1 className="text-2xl font-bold text-premedic-blue">Cotizador de Planes</h1>
            <p className="text-sm text-gray-500">PREMEDIC Medicina Privada</p>
        </div>
    </header>
);

const App: React.FC = () => {
    const [pricingData, setPricingData] = useState<PricingData>(INITIAL_PRICING_DATA);
    const [aportes, setAportes] = useState('');
    const [aporteTotal, setAporteTotal] = useState(0);
    const [edad, setEdad] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<PlanKey>('200');
    const [resultMessage, setResultMessage] = useState<string | null>(null);

    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

    useEffect(() => {
        const aportesNum = parseFloat(aportes);
        if (!isNaN(aportesNum) && aportesNum > 0) {
            const total = (aportesNum * 33.33 * 7.65) / 100;
            setAporteTotal(total);
        } else {
            setAporteTotal(0);
        }
    }, [aportes]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(value);
    };

    const getAgeRangeKey = (age: number): AgeRangeKey | null => {
        if (age >= 1 && age <= 29) return '01-29';
        if (age >= 30 && age <= 39) return '30-39';
        if (age >= 40 && age <= 49) return '40-49';
        if (age >= 50 && age <= 59) return '50-59';
        return null;
    };

    const handleCalculate = () => {
        const ageNum = parseInt(edad);
        if (isNaN(ageNum) || ageNum <= 0) {
            setResultMessage('Por favor, ingrese una edad válida.');
            return;
        }

        if (selectedPlan === 'POR APORTES') {
            const planCost = pricingData[selectedPlan]?.default ?? 0;
            if (aporteTotal >= planCost) {
                setResultMessage('INGRESA SOLO CON APORTES');
            } else {
                const diff = planCost - aporteTotal;
                setResultMessage(`A ABONAR: ${formatCurrency(diff)}`);
            }
            return;
        }

        const ageRangeKey = getAgeRangeKey(ageNum);
        if (!ageRangeKey) {
            setResultMessage('La edad ingresada está fuera de los rangos de los planes.');
            return;
        }

        const planCost = pricingData[selectedPlan]?.[ageRangeKey] ?? null;

        if (planCost === null) {
            setResultMessage('No se encontró un precio para el plan y edad seleccionados.');
            return;
        }

        if (aporteTotal >= planCost) {
            setResultMessage('INGRESA SOLO CON APORTES');
        } else {
            const diff = planCost - aporteTotal;
            setResultMessage(`A ABONAR: ${formatCurrency(diff)}`);
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUpdating(true);
            setUpdateError(null);
            setUpdateSuccess(null);
            try {
                const newPrices = await updatePricesFromImage(file);
                setPricingData(newPrices);
                setUpdateSuccess('¡Tabla de precios actualizada correctamente!');
            } catch (error) {
                if (error instanceof Error) {
                    setUpdateError(error.message);
                } else {
                    setUpdateError('Ocurrió un error desconocido.');
                }
            } finally {
                setIsUpdating(false);
            }
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center font-sans">
            <Header />
            <main className="w-full max-w-md p-4 md:p-6 space-y-6">
                {/* Calculator Card */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="aportes" className="block text-sm font-medium text-gray-700">Aportes</label>
                            <input
                                type="number"
                                id="aportes"
                                value={aportes}
                                onChange={(e) => setAportes(e.target.value.slice(0, 7))}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-premedic-blue focus:border-premedic-blue sm:text-sm"
                                placeholder="Ej: 150000"
                            />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-500">Aporte Total Calculado</p>
                            <p className="text-lg font-bold text-premedic-blue">{formatCurrency(aporteTotal)}</p>
                        </div>
                        <div>
                            <label htmlFor="edad" className="block text-sm font-medium text-gray-700">Edad del Afiliado</label>
                            <input
                                type="number"
                                id="edad"
                                value={edad}
                                onChange={(e) => setEdad(e.target.value.slice(0, 2))}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-premedic-blue focus:border-premedic-blue sm:text-sm"
                                placeholder="Ej: 35"
                            />
                        </div>
                        <div>
                            <label htmlFor="plan" className="block text-sm font-medium text-gray-700">Plan</label>
                            <select
                                id="plan"
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value as PlanKey)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-premedic-blue focus:border-premedic-blue sm:text-sm rounded-md"
                            >
                                <option value="200">Plan 200</option>
                                <option value="300">Plan 300</option>
                                <option value="400">Plan 400</option>
                                <option value="500">Plan 500</option>
                                <option value="POR APORTES">Plan por Aportes</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCalculate}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-premedic-green hover:bg-premedic-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premedic-blue transition-colors"
                        >
                            Cotizar
                        </button>
                    </div>
                </div>

                {/* Result Card */}
                {resultMessage && (
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-lg font-semibold text-premedic-blue">Resultado de la Cotización</h2>
                        <p className="mt-2 text-2xl font-bold text-gray-800">{resultMessage}</p>
                    </div>
                )}
                
                {/* Price Updater Card */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Actualizar Precios con IA</h3>
                    <p className="text-sm text-gray-600 mb-4">Suba una nueva imagen (.png, .jpg) de la tabla de precios para actualizar los valores de la cotización automáticamente.</p>
                     <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        disabled={isUpdating}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-premedic-light-green file:text-premedic-blue
                          hover:file:bg-premedic-green"
                      />
                    {isUpdating && (
                         <div className="mt-4 flex items-center text-sm text-blue-600">
                             <SpinnerIcon />
                             Procesando imagen con Gemini...
                         </div>
                    )}
                    {updateError && <p className="mt-4 text-sm text-red-600">{updateError}</p>}
                    {updateSuccess && <p className="mt-4 text-sm text-green-600">{updateSuccess}</p>}
                </div>
            </main>
        </div>
    );
};

export default App;
