// app/api/twilio-logs/route.js
import { NextResponse } from "next/server";
import twilio from "twilio";

async function fetchUsdToCadRate() {
  const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=CAD");
  if (!res.ok) return 1.42;
  const data = await res.json();
  return data.rates?.CAD || 1.42;
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const monthlyFeeMapUsd = {
  "+17073832531": 0
};

function cleanNumber(num) {
  return num.replace(/^whatsapp:/, "").replace(/\s+/g, "");
}

export async function GET(req) {
  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month")) || 1;
  const year = parseInt(url.searchParams.get("year")) || 2025;
  const usdToCadRate = await fetchUsdToCadRate();

  const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 100 });
  const phoneNameMap = {};
  incomingNumbers.forEach((pn) => {
    const cleaned = cleanNumber(pn.phoneNumber);
    phoneNameMap[cleaned] = pn.friendlyName;
  });

  const allCalls = await client.calls.list({ limit: 1000 });
  const filteredCalls = allCalls.filter((call) => {
    const start = new Date(call.startTime);
    return start.getMonth() + 1 === month && start.getFullYear() === year;
  });

  const allMessages = await client.messages.list({ limit: 1000 });
  const filteredMessages = allMessages.filter((msg) => {
    const date = new Date(msg.dateSent);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });

  const usageByNumber = {};
  function ensurePhoneEntry(phone) {
    if (!usageByNumber[phone]) {
      usageByNumber[phone] = {
        friendlyName: phoneNameMap[phone] || "",
        inboundMinutes: 0,
        outboundMinutes: 0,
        inboundSms: 0,
        outboundSms: 0,
        totalSpentUSD: 0
      };
    }
    return usageByNumber[phone];
  }

  filteredCalls.forEach((call) => {
    const durationSeconds = parseInt(call.duration, 10) || 0;
    const durationMinutes = durationSeconds / 60;
    const price = Math.abs(Number(call.price || 0));
    if (call.direction.includes("inbound")) {
      const toNum = cleanNumber(call.to);
      if (!phoneNameMap[toNum]) return;
      const entry = ensurePhoneEntry(toNum);
      entry.inboundMinutes += durationMinutes;
      entry.totalSpentUSD += price;
    } else {
      const fromNum = cleanNumber(call.from);
      if (!phoneNameMap[fromNum]) return;
      const entry = ensurePhoneEntry(fromNum);
      entry.outboundMinutes += durationMinutes;
      entry.totalSpentUSD += price;
    }
  });

  filteredMessages.forEach((msg) => {
    const price = Math.abs(Number(msg.price || 0));
    if (msg.direction.includes("inbound")) {
      const toNum = cleanNumber(msg.to);
      if (!phoneNameMap[toNum]) return;
      const entry = ensurePhoneEntry(toNum);
      entry.inboundSms += 1;
      entry.totalSpentUSD += price;
    } else {
      const fromNum = cleanNumber(msg.from);
      if (!phoneNameMap[fromNum]) return;
      const entry = ensurePhoneEntry(fromNum);
      entry.outboundSms += 1;
      entry.totalSpentUSD += price;
    }
  });

  const result = Object.keys(usageByNumber).map((phone) => {
    const data = usageByNumber[phone];
    const usageSpentCad = data.totalSpentUSD * usdToCadRate;
    const monthlyFeeUsd = monthlyFeeMapUsd[phone] !== undefined ? monthlyFeeMapUsd[phone] : 1.50;
    const monthlyFeeCad = monthlyFeeUsd * usdToCadRate;
    const grandTotalCad = usageSpentCad + monthlyFeeCad;
    return {
      number: phone,
      friendlyName: data.friendlyName,
      inboundMinutes: data.inboundMinutes.toFixed(2),
      outboundMinutes: data.outboundMinutes.toFixed(2),
      inboundSms: data.inboundSms,
      outboundSms: data.outboundSms,
      usageCost: usageSpentCad.toFixed(4),
      monthlyFee: monthlyFeeCad.toFixed(4),
      totalSpent: grandTotalCad.toFixed(4)
    };
  });

  return NextResponse.json(result);
}
