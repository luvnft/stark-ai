import React from 'react'; // Ensure React is imported if not already
import {
    VoiceProvider,
    ToolCall,
    ToolCallHandler,
    ToolResponse,
    ToolError,
} from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import Airports from './airports.json';
import Cities from './cities.json';

const handleToolCall: ToolCallHandler = async (
    toolCall: ToolCall
): Promise<ToolResponse | ToolError> => {
    console.log("Tool call received", toolCall);

    if (toolCall.name === 'get_flight_price') {
        try {
            const args = JSON.parse(toolCall.parameters) as {
                departure: string;
                arrival: string;
                date_of_travel: string;
            };

            const deptCity = Cities.find((city: any) => city.name === args.departure);
            const arrCity = Cities.find((city: any) => city.name === args.arrival);

            if (!deptCity || !arrCity) {
                return {
                    type: 'tool_error',
                    tool_call_id: toolCall.tool_call_id,
                    error: 'City not found',
                    code: 'city_not_found',
                    level: 'warn',
                    content: 'Departure or arrival city not found',
                };
            }

            const deptCityCode = deptCity.code;
            const arrCityCode = arrCity.code;

            const departureAirport = Airports.find((airport: any) => airport.city_code === deptCityCode);
            const arrivalAirport = Airports.find((airport: any) => airport.city_code === arrCityCode);

            if (!departureAirport || !arrivalAirport) {
                return {
                    type: 'tool_error',
                    tool_call_id: toolCall.tool_call_id,
                    error: 'Airport not found',
                    code: 'airport_not_found',
                    level: 'warn',
                    content: 'Departure or arrival airport not found',
                };
            }

            const resp2 = await fetch('/api/fetchCheapPrices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    departureAirport: departureAirport.code,
                    arrivalAirport: arrivalAirport.code,
                    date_of_travel: args.date_of_travel,
                }),
            });
            const flightPrice = await resp2.json();
            if (flightPrice.length === 0) {
                return {
                    type: 'tool_response',
                    tool_call_id: toolCall.tool_call_id,
                    content: 'No Flights Found',
                };
            }

            console.log(flightPrice);
            return {
                type: 'tool_response',
                tool_call_id: toolCall.tool_call_id,
                content: JSON.stringify(flightPrice),
            };
        } catch (error) {
            return {
                type: 'tool_error',
                tool_call_id: toolCall.tool_call_id,
                error: 'Flight price tool error',
                code: 'flight_price_tool_error',
                level: 'warn',
                content: 'There was an error with the flight price tool',
            };
        }
    } else {
        return {
            type: 'tool_error',
            tool_call_id: toolCall.tool_call_id,
            error: 'Tool not found',
            code: 'tool_not_found',
            level: 'warn',
            content: 'The tool you requested was not found',
        };
    }
};

const ClientComponent: React.FC<{ accessToken: string }> = ({ accessToken }) => {
    return (
        <VoiceProvider
            configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID || ""}
            auth={{ type: "accessToken", value: accessToken }}
            onToolCall={handleToolCall}
        >
            <div className="h-[100vh] flex w-full">
                <div className="flex items-center p-5">
                    <div>
                        <div id="mic" className="w-[400px]">
                            {/* Mic component or placeholder */}
                        </div>
                    </div>
                </div>

                <Messages />
                <Controls />
            </div>
        </VoiceProvider>
    );
};

export default ClientComponent;
