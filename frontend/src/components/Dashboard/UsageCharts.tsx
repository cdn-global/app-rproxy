// // src/components/Dashboard/UsageCharts.tsx

// import React, { useMemo, useRef, useEffect } from 'react';
// import { Grid, GridItem } from '@chakra-ui/react';
// import CanvasJSReact from '@canvasjs/react-charts';

// const { CanvasJSChart } = CanvasJSReact;

// // --- Data Generation and Simulation (Reverted to the original, working version) ---
// const generateCanvasJSData = (periodStart: number | null, totalRequests: number, totalDataGB: number) => {
//   const requestsDps: { x: Date; y: number }[] = [];
//   const inboundDps: { x: Date; y: number }[] = [];
//   const outboundDps: { x: Date; y: number }[] = [];
//   if (!periodStart || (totalRequests <= 0 && totalDataGB <= 0)) { return { requestsDps, inboundDps, outboundDps }; }
//   const startDate = new Date(periodStart * 1000);
//   const today = new Date();
//   if (startDate > today) return { requestsDps, inboundDps, outboundDps };
//   const datePoints: Date[] = [];
//   for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) { datePoints.push(new Date(d)); }
//   if (datePoints.length === 0) return { requestsDps, inboundDps, outboundDps };
//   const weights = datePoints.map(() => Math.random());
//   const totalWeight = weights.reduce((sum, w) => sum + w, 0);
//   let runningTotalRequests = 0, runningTotalData = 0;
//   weights.forEach((weight, i) => {
//     const isLast = i === weights.length - 1;
//     const date = datePoints[i];
//     const dailyRequests = isLast ? totalRequests - runningTotalRequests : Math.round((weight / totalWeight) * totalRequests);
//     runningTotalRequests += dailyRequests;
//     requestsDps.push({ x: date, y: dailyRequests >= 0 ? dailyRequests : 0 });
//     const dailyData = isLast ? totalDataGB - runningTotalData : parseFloat(((weight / totalWeight) * totalDataGB).toFixed(2));
//     runningTotalData += dailyData;
//     const outboundRatio = 0.4 + Math.random() * 0.2;
//     const dailyOutbound = parseFloat((dailyData * outboundRatio).toFixed(2));
//     const dailyInbound = parseFloat((dailyData - dailyOutbound).toFixed(2));
//     outboundDps.push({ x: date, y: dailyOutbound >= 0 ? dailyOutbound : 0 });
//     inboundDps.push({ x: date, y: dailyInbound >= 0 ? dailyInbound : 0 });
//   });
//   return { requestsDps, inboundDps, outboundDps };
// };

// // --- Synchronization Logic (No changes) ---
// const syncCharts = (charts: any[], syncToolTip: boolean, syncCrosshair: boolean, syncAxisXRange: boolean) => {
//   const onToolTipUpdated = function(e: any) { for (const chart of charts) { if (chart !== e.chart) chart.toolTip.showAtX(e.entries[0].xValue); } };
//   const onToolTipHidden = function(e: any) { for (const chart of charts) { if (chart !== e.chart) chart.toolTip.hide(); } };
//   const onCrosshairUpdated = function(e: any) { for (const chart of charts) { if (chart !== e.chart) chart.axisX[0].crosshair.showAt(e.value); } };
//   const onCrosshairHidden = function(e: any) { for (const chart of charts) { if (chart !== e.chart) chart.axisX[0].crosshair.hide(); } };
//   const onRangeChanged = function(e: any) { for (const chart of charts) { if (e.trigger === "reset") { chart.options.axisX.viewportMinimum = chart.options.axisX.viewportMaximum = null; chart.render(); } else if (chart !== e.chart) { chart.options.axisX.viewportMinimum = e.axisX[0].viewportMinimum; chart.options.axisX.viewportMaximum = e.axisX[0].viewportMaximum; chart.render(); } } };
//   for (const chart of charts) {
//     if (!chart) continue; // Add a safeguard
//     if (syncToolTip) { if (!chart.options.toolTip) chart.options.toolTip = {}; chart.options.toolTip.updated = onToolTipUpdated; chart.options.toolTip.hidden = onToolTipHidden; }
//     if (syncCrosshair) { if (!chart.options.axisX) chart.options.axisX = { crosshair: { enabled: true } }; else if(!chart.options.axisX.crosshair) chart.options.axisX.crosshair = { enabled: true }; chart.options.axisX.crosshair.updated = onCrosshairUpdated; chart.options.axisX.crosshair.hidden = onCrosshairHidden; }
//     if (syncAxisXRange) { chart.options.zoomEnabled = true; chart.options.rangeChanged = onRangeChanged; }
//   }
// };

// interface UsageChartsProps {
//   periodStart: number | null | undefined;
//   totalRequests: number;
//   totalDataGB: number;
// }

// const UsageCharts: React.FC<UsageChartsProps> = ({ periodStart, totalRequests, totalDataGB }) => {
//   // The useRef type is fine as `any[]` since the library has no official types.
//   const chartInstances = useRef<any[]>([]);
//   const { requestsDps, inboundDps, outboundDps } = useMemo(() => generateCanvasJSData(periodStart || null, totalRequests, totalDataGB), [periodStart, totalRequests, totalDataGB]);

//   useEffect(() => {
//     if (chartInstances.current.length === 2 && chartInstances.current.every(c => c)) {
//       syncCharts(chartInstances.current, true, true, false);
//     }
//   }, [requestsDps]);

//   const commonAxisXOptions = {
//     valueFormatString: "DD MMM",
//     crosshair: {
//       enabled: true,
//       snapToDataPoint: true,
//       thickness: 1,
//     },
//   };

//   const requestsChartOptions = {
//     animationEnabled: true,
//     theme: "light2",
//     title: { text: "Requests", fontSize: 16, margin: 20, horizontalAlign: "left" },
//     axisX: commonAxisXOptions,
//     axisY: {
//       title: "Daily Requests",
//       gridThickness: 0.5,
//       crosshair: { enabled: true, snapToDataPoint: true, labelFormatter: (e: any) => e.value.toLocaleString() },
//       margin: 50,
//     },
//     toolTip: { shared: true },
//     data: [{
//         type: "area",
//         name: "Requests",
//         xValueFormatString: "DD MMMM YYYY",
//         yValueFormatString: "#,##0",
//         color: "rgba(56, 161, 105, 0.7)", // Chakra Green 500 with opacity
//         dataPoints: requestsDps
//     }],
//   };

//   const dataTransferChartOptions = {
//     animationEnabled: true,
//     theme: "light2",
//     title: { text: "Data Transfer", fontSize: 16, margin: 20, horizontalAlign: "left" },
//     axisX: commonAxisXOptions,
//     axisY: {
//       title: "Daily Transfer (GB)",
//       gridThickness: 0.5,
//       suffix: " GB",
//       crosshair: { enabled: true, snapToDataPoint: true, labelFormatter: (e: any) => `${e.value.toFixed(2)} GB` },
//       margin: 50,
//     },
//     toolTip: { shared: true },
//     legend: { cursor: "pointer", itemclick: (e: any) => { e.dataSeries.visible = typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible ? false : true; e.chart.render(); } },
//     data: [
//       {
//         type: "splineArea",
//         name: "Inbound",
//         showInLegend: true,
//         yValueFormatString: "#,##0.## GB",
//         color: "#68D391", // Chakra Green 300
//         dataPoints: inboundDps
//       },
//       {
//         type: "splineArea",
//         name: "Outbound",
//         showInLegend: true,
//         yValueFormatString: "#,##0.## GB",
//         color: "#2F855A", // Chakra Green 700
//         dataPoints: outboundDps
//       },
//     ],
//   };
// return (
//     <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
//       <GridItem shadow="md" borderWidth="1px" borderRadius="md" p={4}>
//         <CanvasJSChart
//           options={requestsChartOptions}
//           // FIX: Explicitly type the `ref` parameter as `any`
//           onRef={(ref: any) => (chartInstances.current[0] = ref)}
//         />
//       </GridItem>
//       <GridItem shadow="md" borderWidth="1px" borderRadius="md" p={4}>
//         <CanvasJSChart
//           options={dataTransferChartOptions}
//           // FIX: Explicitly type the `ref` parameter as `any`
//           onRef={(ref: any) => (chartInstances.current[1] = ref)}
//         />
//       </GridItem>
//     </Grid>
//   );
// };

// export default UsageCharts;
