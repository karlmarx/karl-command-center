const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM;
const TO = process.env.TWILIO_TO;

export async function sendSms(body: string) {
  if (!SID || !TOKEN || !FROM || !TO) {
    throw new Error(
      "twilio not configured (TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM / TO required)"
    );
  }
  if (body.length > 1600) {
    throw new Error("sms body too long");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
  const params = new URLSearchParams({ From: FROM, To: TO, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${SID}:${TOKEN}`).toString(
        "base64"
      )}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`twilio ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { sid: string; status: string };
  return { sid: data.sid, status: data.status };
}
