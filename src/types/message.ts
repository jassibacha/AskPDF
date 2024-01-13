import { AppRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";

// Define the type for the output of the AppRouter
type RouterOutput = inferRouterOutputs<AppRouter>;

// Extract the type for the 'messages' property of 'getFileMessages' from the RouterOutput
type Messages = RouterOutput["getFileMessages"]["messages"];

// Omit the 'text' property from each item in the Messages array
type OmitText = Omit<Messages[number], "text">;

// Define a type for the ExtendedText object
type ExtendedText = {
    text: string | JSX.Element;
};

// Combine the OmitText and ExtendedText types to create the ExtendedMessage type
export type ExtendedMessage = OmitText & ExtendedText;