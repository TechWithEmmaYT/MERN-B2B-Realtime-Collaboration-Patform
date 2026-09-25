import { Resend } from "resend";

import { Env } from "./env.config";

// Null when no API key is configured, so local development works without email.
export const resend = Env.RESEND_API_KEY ? new Resend(Env.RESEND_API_KEY) : null;
