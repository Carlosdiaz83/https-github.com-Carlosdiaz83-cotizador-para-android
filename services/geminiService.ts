
import { GoogleGenAI, Type } from "@google/genai";
import { PricingData } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:image/jpeg;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const schema = {
  type: Type.OBJECT,
  properties: {
    "200": { type: Type.OBJECT, properties: { "01-29": { type: Type.NUMBER }, "30-39": { type: Type.NUMBER }, "40-49": { type: Type.NUMBER }, "50-59": { type: Type.NUMBER } } },
    "300": { type: Type.OBJECT, properties: { "01-29": { type: Type.NUMBER }, "30-39": { type: Type.NUMBER }, "40-49": { type: Type.NUMBER }, "50-59": { type: Type.NUMBER } } },
    "400": { type: Type.OBJECT, properties: { "01-29": { type: Type.NUMBER }, "30-39": { type: Type.NUMBER }, "40-49": { type: Type.NUMBER }, "50-59": { type: Type.NUMBER } } },
    "500": { type: Type.OBJECT, properties: { "01-29": { type: Type.NUMBER }, "30-39": { type: Type.NUMBER }, "40-49": { type: Type.NUMBER }, "50-59": { type: Type.NUMBER } } },
  },
};


export const updatePricesFromImage = async (imageFile: File): Promise<PricingData> => {
  try {
    const base64Image = await fileToBase64(imageFile);

    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: base64Image,
      },
    };

    const textPart = {
        text: `
        Analiza la siguiente imagen que contiene una tabla de precios de planes de salud.
        Extrae los precios únicamente para la categoría "Individual" para cada plan (Plan 200, Plan 300, Plan 400, Plan 500) y para cada rango de edad.
        Estructura la salida como un objeto JSON que coincida con el esquema proporcionado.
        Las claves del objeto principal deben ser los números de los planes como cadenas de texto ('200', '300', etc.).
        Cada objeto de plan debe tener claves que representen los rangos de edad (ej. '01-29', '30-39', '40-49', '50-59').
        Los valores deben ser los precios correspondientes como números. Ignora los símbolos de moneda y los separadores de miles al extraer los números.
        `
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    // We need to merge this with the existing structure to keep "POR APORTES"
    const newPricingData: PricingData = {
        ...parsedData,
        'POR APORTES': {
            default: 9000
        }
    };
    
    return newPricingData;

  } catch (error) {
    console.error("Error processing image with Gemini API:", error);
    throw new Error("No se pudieron actualizar los precios desde la imagen.");
  }
};
