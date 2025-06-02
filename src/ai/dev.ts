
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-declaration.ts';
import '@/ai/flows/daily-celiac-tip-flow.ts';
import '@/ai/flows/assess-product-risk-flow.ts'; // Added new flow
import '@/ai/flows/ocr-declaration-flow.ts'; // Added OCR flow

    
