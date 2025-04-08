// app/page.js
"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress
} from "@mui/material";

export default function Home() {
  const [usage, setUsage] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = (m, y) => {
    setIsLoading(true);
    fetch(`/api/twilio-logs?month=${m}&year=${y}`)
      .then((r) => r.json())
      .then((d) => setUsage(d))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData(month, year);
  }, [month, year]);

  const computeTotals = (data) => {
    const totals = {
      inboundMinutes: 0,
      outboundMinutes: 0,
      inboundSms: 0,
      outboundSms: 0,
      usageCost: 0,
      monthlyFee: 0,
      totalSpent: 0
    };
    data.forEach((item) => {
      totals.inboundMinutes += parseFloat(item.inboundMinutes) || 0;
      totals.outboundMinutes += parseFloat(item.outboundMinutes) || 0;
      totals.inboundSms += item.inboundSms || 0;
      totals.outboundSms += item.outboundSms || 0;
      totals.usageCost += parseFloat(item.usageCost) || 0;
      totals.monthlyFee += parseFloat(item.monthlyFee) || 0;
      totals.totalSpent += parseFloat(item.totalSpent) || 0;
    });
    return totals;
  };

  const totals = computeTotals(usage);

  if (isLoading) {
    return (
      <Container maxWidth="md" style={{ marginTop: "2rem", textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const grandTotal = totals.totalSpent.toFixed(4);

  return (
    <Container maxWidth="md" style={{ marginTop: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        📞 Twilio Number Usage
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <FormControl fullWidth>
          <InputLabel>Month</InputLabel>
          <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value)}>
            {[...Array(12)].map((_, i) => (
              <MenuItem key={i} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
            {[2024, 2025].map((yr) => (
              <MenuItem key={yr} value={yr}>
                {yr}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Client</b></TableCell>
              <TableCell><b>Phone Number</b></TableCell>
              <TableCell><b>Inbound Minutes</b></TableCell>
              <TableCell><b>Outbound Minutes</b></TableCell>
              <TableCell><b>Inbound SMS</b></TableCell>
              <TableCell><b>Outbound SMS</b></TableCell>
              <TableCell><b>Usage Cost (CAD)</b></TableCell>
              <TableCell><b>Monthly Fee (CAD)</b></TableCell>
              <TableCell><b>Total (CAD)</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usage.map((item) => (
              <TableRow key={item.number}>
                <TableCell>{item.friendlyName}</TableCell>
                <TableCell>{item.number}</TableCell>
                <TableCell>{item.inboundMinutes}</TableCell>
                <TableCell>{item.outboundMinutes}</TableCell>
                <TableCell>{item.inboundSms}</TableCell>
                <TableCell>{item.outboundSms}</TableCell>
                <TableCell>${item.usageCost}</TableCell>
                <TableCell>${item.monthlyFee}</TableCell>
                <TableCell>${item.totalSpent}</TableCell>
              </TableRow>
            ))}
            {usage.length > 0 && (
              <TableRow>
                <TableCell colSpan={2}><b>Totals</b></TableCell>
                <TableCell>{totals.inboundMinutes.toFixed(2)}</TableCell>
                <TableCell>{totals.outboundMinutes.toFixed(2)}</TableCell>
                <TableCell>{totals.inboundSms}</TableCell>
                <TableCell>{totals.outboundSms}</TableCell>
                <TableCell>${totals.usageCost.toFixed(4)}</TableCell>
                <TableCell>${totals.monthlyFee.toFixed(4)}</TableCell>
                <TableCell>${totals.totalSpent.toFixed(4)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {usage.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6"><b>Grand Total Cost: ${grandTotal} CAD</b></Typography>
        </Box>
      )}
    </Container>
  );
}
