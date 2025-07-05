"use client";
import React, { useState, useRef, useEffect } from "react";
import { parseStringPromise } from "xml2js";
import { pdf } from "@react-pdf/renderer";
import ReportPDF from "./ReportPDF";

// NOTE: If you see a module not found error for @react-pdf/renderer, run: npm install @react-pdf/renderer

const BANKS = [
  {
    name: "Bank of Cyprus",
    logo: "/bank-logos/bank-of-cyprus.jpg",
  },
  {
    name: "Eurobank Cyprus",
    logo: "/bank-logos/eurobank-cyprus.png",
  },
  {
    name: "AstroBank",
    logo: "/bank-logos/astrobank.png",
  },
  {
    name: "RCB Bank",
    logo: "/bank-logos/rcb-bank.png",
  },
  {
    name: "Hellenic Bank",
    logo: "/bank-logos/hellenic-bank.jpg",
  },
  {
    name: "Alpha Bank Cyprus",
    logo: "/bank-logos/alpha-bank-cyprus.jpeg",
  },
  {
    name: "Ancoria Bank",
    logo: "/bank-logos/ancoria-bank.jpg",
  },
];

const REPORT_TYPES = [
  {
    name: "Field Report",
    icon: "📝",
  },
  {
    name: "Plot Report",
    icon: "📄",
  },
  {
    name: "Flat Under Construction Report",
    icon: "🏗️",
  },
];

// Templates for Introduction
const INTRO_TEMPLATES = [
  (bankName: string, reportType: string) =>
    `This construction progress assessment report has been prepared for ${bankName || '[Bank Name]'} to evaluate the current state of the residential ${reportType || '[Report Type]'}, following banking industry standards for construction financing.`,
  () => "This report provides an independent assessment of the current progress and quality of construction, ensuring compliance with approved plans and regulatory requirements.",
  () => "The purpose of this report is to document the present condition and development status of the property, supporting the bank's decision-making process regarding loan disbursement.",
];

// Templates for Plot Description
const PLOT_DESC_TEMPLATES = [
  (reportType: string) =>
    `The residential ${reportType || '[Report Type]'} under construction is being assessed for completion status, quality of work, and compliance with approved plans as required for construction loan evaluation.`,
  () => "The plot is located in a well-established area with access to essential infrastructure, including roads, water, and electricity. The boundaries are clearly demarcated, and the land is suitable for the intended development.",
  () => "Site inspection confirms that the plot is free from encroachments and is in accordance with the provided cadastral plans. The surrounding environment is compatible with residential use.",
];

// Templates for Findings
const FINDINGS_TEMPLATES = [
  (bankName: string, reportType: string) =>
    `Based on our detailed construction assessment conducted according to ${bankName || '[Bank Name]'} construction financing guidelines, the ${reportType || '[Report Type]'} under construction exhibits the following progress and characteristics:`,
  () => "Construction has reached the completion of the structural framework, with masonry and roofing works in progress. All materials used meet the required standards, and no significant deviations from the approved plans have been observed.",
  () => "The site is well-organized, with safety measures in place. Utilities have been partially installed, and the project is progressing according to the submitted timeline.",
];

// Templates for Conclusion
const CONCLUSION_TEMPLATES = [
  (bankName: string) =>
    `In conclusion, this construction assessment provides detailed documentation of the current construction status and quality, meeting ${bankName || '[Bank Name]'} requirements for construction loan monitoring and disbursement.`,
  () => "The property is progressing satisfactorily, with no major issues identified during the inspection. Continued monitoring is recommended to ensure timely completion and adherence to quality standards.",
  () => "It is recommended that the next tranche of the construction loan be released, as the works completed to date are in line with the approved schedule and specifications.",
];

export default function Home() {
  // Multi-stage form state
  const [stage, setStage] = useState(1);

  // Main property/report fields
  const [bankName, setBankName] = useState("");
  const [reportType, setReportType] = useState("");
  const [plotNumber, setPlotNumber] = useState("");
  const [plotArea, setPlotArea] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [location, setLocation] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [area, setArea] = useState("");
  const [sheetPlan, setSheetPlan] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [zone, setZone] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");
  const [buildingCoefficient, setBuildingCoefficient] = useState("");
  const [coverage, setCoverage] = useState("");
  const [floors, setFloors] = useState("");
  const [height, setHeight] = useState("");
  const [value2018, setValue2018] = useState("");
  const [value2021, setValue2021] = useState("");

  // Report meta fields
  const [reportTitle, setReportTitle] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [introduction, setIntroduction] = useState("");
  const [plotDescription, setPlotDescription] = useState("");
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");

  // Track if user has manually edited the report title
  const [reportTitleTouched, setReportTitleTouched] = useState(false);

  React.useEffect(() => {
    if (!reportTitleTouched) {
      setReportTitle(`${reportType || '[Report Type]'} - Prepared for ${bankName || '[Bank Name]'}`);
    }
  }, [reportType, bankName]);

  // KML file state
  const [kmlFile, setKmlFile] = useState<File | null>(null);
  const [kmlError, setKmlError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Modal state for templates
  const [showIntroTemplates, setShowIntroTemplates] = useState(false);
  const [showPlotDescTemplates, setShowPlotDescTemplates] = useState(false);
  const [showFindingsTemplates, setShowFindingsTemplates] = useState(false);
  const [showConclusionTemplates, setShowConclusionTemplates] = useState(false);

  // Image upload state
  const [imagePreviews, setImagePreviews] = useState<{
    [key: string]: string;
  }>({});

  // Add state for PDF generation loading
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Add after imagePreviews state
  const [plotPolygon, setPlotPolygon] = useState<[number, number][]>([]);

  // Navigation helpers
  const nextStage = () => setStage((s) => Math.min(s + 1, 7));
  const prevStage = () => setStage((s) => Math.max(s - 1, 1));

  // Helper: extract text from CDATA or string
  function extractText(val: unknown): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return extractText(val[0]);
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj._cdata === "string") return obj._cdata;
      if (typeof obj._ === "string") return obj._;
    }
    return "";
  }

  // Helper: extract value from <b>...</b> in HTML
  function extractBold(html: string, label: string): string {
    const regex = new RegExp(label + ": <b>(.*?)<\\/b>", "i");
    const match = html.match(regex);
    return match ? match[1].trim() : "";
  }

  // Helper: extract value from <hr> separated HTML
  function extractByLabel(html: string, label: string): string {
    return extractBold(html, label);
  }

  // Helper: extract coordinates from KML
  function extractCoordinates(kml: unknown): { coords: string, count: number, center: string } {
    try {
      // Try to extract from <LookAt> first
      // @ts-expect-error: dynamic structure
      const doc = kml.kml.Document[0];
      let lookAtCoords = "";
      if (doc.Placemark && doc.Placemark[0].LookAt) {
        const lookAt = doc.Placemark[0].LookAt[0];
        const lat = lookAt.latitude?.[0]?._ || lookAt.latitude?.[0];
        const lng = lookAt.longitude?.[0]?._ || lookAt.longitude?.[0];
        if (lat && lng) {
          lookAtCoords = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
        }
      }
      // Fallback to Folder Placemark
      if (!lookAtCoords && doc.Folder && doc.Folder[0].Placemark && doc.Folder[0].Placemark[0].LookAt) {
        const lookAt = doc.Folder[0].Placemark[0].LookAt[0];
        const lat = lookAt.latitude?.[0]?._ || lookAt.latitude?.[0];
        const lng = lookAt.longitude?.[0]?._ || lookAt.longitude?.[0];
        if (lat && lng) {
          lookAtCoords = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
        }
      }
      if (lookAtCoords) {
        return { coords: lookAtCoords, count: 1, center: lookAtCoords };
      }
      // Fallback to polygon center
      const coordsString: string = doc.Folder[0].Placemark[0].Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates[0];
      const coordsArr: [number, number][] = coordsString.trim().split(/\s+/).map((c: string) => {
        const [lng, lat] = c.split(",").slice(0, 2).map(Number) as [number, number];
        return [lng, lat];
      });
      const count = coordsArr.length;
      const center = coordsArr.reduce((acc: [number, number], curr: [number, number]) => [acc[0] + curr[0], acc[1] + curr[1]], [0, 0]).map((v: number) => v / count);
      const centerStr = `${center[1].toFixed(6)}, ${center[0].toFixed(6)}`;
      return {
        coords: centerStr,
        count,
        center: centerStr,
      };
    } catch {
      return { coords: "", count: 0, center: "" };
    }
  }

  // Helper: replace Greek mu with 'm' for international units
  function replaceMuWithM(val: string): string {
    return val.replace(/μ/g, 'm');
  }

  // KML parsing and state update
  async function handleKmlFile(file: File) {
    setKmlError("");
    try {
      const text = await file.text();
      const kml = await parseStringPromise(text, { explicitArray: true, explicitCharkey: true, trim: true, preserveChildrenOrder: true });
      // Extract main fields
      const doc = kml.kml.Document[0];
      // Plot Number
      const plotNumber = extractText(doc.name);
      setPlotNumber(plotNumber);
      // Folder Placemark description (HTML table)
      const folderPlacemark = doc.Folder?.[0]?.Placemark?.[0];
      const descHtml = extractText(folderPlacemark?.description);
      // Municipality
      setMunicipality(replaceMuWithM(extractByLabel(descHtml, "Δήμος")));
      // Area
      setArea(replaceMuWithM(extractByLabel(descHtml, "Εμβαδό")));
      setPlotArea(replaceMuWithM(extractByLabel(descHtml, "Εμβαδό")));
      // Sheet/Plan
      setSheetPlan(replaceMuWithM(extractByLabel(descHtml, "Αρ. Φ/Σχ")));
      // Registration No
      setRegistrationNo(replaceMuWithM(extractByLabel(descHtml, "Αριθμός εγγραφης")));
      // Property Type
      setPropertyType(replaceMuWithM(extractByLabel(descHtml, "Ειδος Ακινήτου")));
      // Zone
      setZone(replaceMuWithM(extractByLabel(descHtml, "Ζώνη")));
      // Zone Description
      setZoneDescription(replaceMuWithM(extractByLabel(descHtml, "Ζωνη Περιγραφή")));
      // Building Coefficient
      setBuildingCoefficient(replaceMuWithM(extractByLabel(descHtml, "Δόμηση")));
      // Coverage
      setCoverage(replaceMuWithM(extractByLabel(descHtml, "Κάλυψη")));
      // Floors
      const rawFloors = replaceMuWithM(extractByLabel(descHtml, "Ορόφοι"));
      setFloors(rawFloors.replace(/,\s*$/, ""));
      // Height
      setHeight(replaceMuWithM(extractByLabel(descHtml, "Υψος")));
      // Value 2018
      setValue2018(replaceMuWithM(extractByLabel(descHtml, "Αξία 2018")));
      // Value 2021
      setValue2021(replaceMuWithM(extractByLabel(descHtml, "Αξία 2021")));
      // Location
      setLocation(replaceMuWithM(extractByLabel(descHtml, "Δήμος")));
      // Coordinates (show all coordinates as string)
      const coordsInfo = extractCoordinates(kml);
      setCoordinates(coordsInfo.coords);
      // Extract polygon coordinates for SVG
      try {
        const coordsStringRaw = doc.Folder[0].Placemark[0].Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates;
        console.log("KML Polygon coordinates raw:", coordsStringRaw, "type:", typeof coordsStringRaw, Array.isArray(coordsStringRaw));
        let coordsString = '';
        if (Array.isArray(coordsStringRaw)) {
          if (typeof coordsStringRaw[0] === 'string') {
            coordsString = coordsStringRaw[0];
          } else if (coordsStringRaw[0] && typeof coordsStringRaw[0]._ === 'string') {
            coordsString = coordsStringRaw[0]._;
          }
        } else if (typeof coordsStringRaw === 'string') {
          coordsString = coordsStringRaw;
        } else if (coordsStringRaw && typeof coordsStringRaw._ === 'string') {
          coordsString = coordsStringRaw._;
        }
        console.log("KML Polygon string used:", coordsString);
        const coordsArr: [number, number][] = coordsString.trim().split(/\s+/).map((c: string) => {
          const [lng, lat] = c.split(",").slice(0, 2).map(Number) as [number, number];
          return [lng, lat];
        });
        setPlotPolygon(coordsArr);
        console.log("KML Polygon parsed array:", coordsArr);
      } catch (err) {
        setPlotPolygon([]);
        console.error("Failed to extract polygon from KML", err);
      }
      // KML Source
      // (You can add a state for KML source if needed)
      // Plot Image: Available (if you want to set a flag)
      // Coordinates Count
      // (You can add a state for this if needed)
    } catch {
      setKmlError("Failed to parse KML file. Please upload a valid KML file.");
    }
  }

  // KML upload handlers
  const handleKmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKmlError("");
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".kml")) {
      setKmlFile(file);
      handleKmlFile(file);
    } else {
      setKmlError("Please upload a valid .kml file.");
      setKmlFile(null);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".kml")) {
      setKmlFile(file);
      handleKmlFile(file);
      setKmlError("");
    } else {
      setKmlError("Please upload a valid .kml file.");
      setKmlFile(null);
    }
  };

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, label: string) {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => ({ ...prev, [label]: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviews((prev) => ({ ...prev, [label]: "" }));
    }
  }

  function handleImageDrop(e: React.DragEvent<HTMLLabelElement>, label: string) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => ({ ...prev, [label]: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviews((prev) => ({ ...prev, [label]: "" }));
    }
  }

  function handleImageDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
  }

  // Summary for stage 6
  const summaryRows = [
    { label: "Bank Name", value: bankName },
    { label: "Report Type", value: reportType },
    { label: "Plot Number", value: plotNumber },
    { label: "Plot Area", value: plotArea },
    { label: "Coordinates", value: coordinates || "" },
    { label: "Location", value: location },
    { label: "Municipality", value: municipality },
    { label: "Area", value: area },
    { label: "Sheet/Plan", value: sheetPlan },
    { label: "Registration No", value: registrationNo },
    { label: "Property Type", value: propertyType },
    { label: "Zone", value: zone },
    { label: "Zone Description", value: zoneDescription },
    { label: "Building Coefficient", value: buildingCoefficient },
    { label: "Coverage", value: coverage },
    { label: "Floors", value: floors },
    { label: "Height", value: height },
    { label: "Value 2018", value: value2018 },
    { label: "Value 2021", value: value2021 },
    { label: "Report Title", value: reportTitle },
    { label: "Report Date", value: reportDate },
    { label: "Introduction", value: introduction },
    { label: "Plot Description", value: plotDescription },
    { label: "Findings", value: findings },
    { label: "Conclusion", value: conclusion },
    { label: "KML File", value: kmlFile ? kmlFile.name : "Not uploaded" },
  ];

  // Handler to generate and download PDF
  async function handleGeneratePDF() {
    setPdfGenerating(true);
    try {
      let plotImage = undefined;
      if (plotPolygon.length > 2 && plotSvgRef.current) {
        try {
          const svg = plotSvgRef.current;
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svg);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          const img = new window.Image();
          img.width = 300;
          img.height = 300;
          // Use await in a Promise to get the data URL
          plotImage = await new Promise<string>((resolve, reject) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = 300;
                canvas.height = 300;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('No canvas context');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, 300, 300);
                ctx.drawImage(img, 0, 0, 300, 300);
                resolve(canvas.toDataURL('image/png'));
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = reject;
            img.src = url;
          });
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Failed to convert SVG to PNG for PDF', err);
        }
      }
      const doc = (
        <ReportPDF
          bankName={bankName}
          reportType={reportType}
          plotNumber={plotNumber}
          plotArea={plotArea}
          coordinates={coordinates}
          location={location}
          municipality={municipality}
          area={area}
          sheetPlan={sheetPlan}
          registrationNo={registrationNo}
          propertyType={propertyType}
          zone={zone}
          zoneDescription={zoneDescription}
          buildingCoefficient={buildingCoefficient}
          coverage={coverage}
          floors={floors}
          height={height}
          value2018={value2018}
          value2021={value2021}
          reportTitle={reportTitle}
          reportDate={reportDate}
          introduction={introduction}
          plotDescription={plotDescription}
          findings={findings}
          conclusion={conclusion}
          plotImage={plotImage}
        />
      );
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle || "plot-report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  }

  // Add a ref for the SVG
  const plotSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    document.body.style.background = '#fff';
    document.documentElement.style.background = '#fff';
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto mt-8 bg-white rounded-xl shadow-lg text-zinc-900">
      <h1 className="text-3xl font-bold mb-6 text-center">Plot Report Generator</h1>
      <div className="flex justify-center mb-8">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`w-8 h-2 rounded-full transition-all duration-200 ${stage === s
                ? "bg-blue-500"
                : stage > s
                  ? "bg-blue-800"
                  : "bg-zinc-700"
                }`}
            />
          ))}
        </div>
      </div>
      {/* Stage 1: Select Bank */}
      {stage === 1 && (
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-4">Select Bank</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BANKS.map((bank) => (
                <button
                  key={bank.name}
                  type="button"
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${bankName === bank.name
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-900"
                    }`}
                  onClick={() => setBankName(bank.name)}
                >
                  <img
                    src={bank.logo}
                    alt={bank.name + " logo"}
                    className="w-12 h-12 object-contain rounded bg-white"
                  />
                  <span className="font-medium text-lg">{bank.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <div />
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              onClick={nextStage}
              disabled={!bankName}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* Stage 2: Select Report Type */}
      {stage === 2 && (
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-4">Select Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.name}
                  type="button"
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${reportType === type.name
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-900"
                    }`}
                  onClick={() => setReportType(type.name)}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-medium text-lg">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="px-6 py-2 bg-zinc-700 text-zinc-100 rounded-lg font-semibold"
              onClick={prevStage}
            >
              Back
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              onClick={nextStage}
              disabled={!reportType}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* Stage 3: KML Upload */}
      {stage === 3 && (
        <div className="space-y-8">
          <div className="mb-2">
            <span className="block text-lg font-semibold mb-2">Upload KML File</span>
            <span className="block mb-4 text-zinc-700">
              You can download a KML report through the{' '}
              <a
                href="https://maps.palsurveying.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                PAL Surveying Platform
              </a>
              .
            </span>
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${dragActive ? "border-blue-500 bg-blue-100" : "border-zinc-300 bg-white hover:bg-zinc-100"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              htmlFor="kml-upload"
            >
              <span className="text-zinc-400 mb-2">Drag & drop your KML file here, or click to upload</span>
              <input
                ref={fileInputRef}
                id="kml-upload"
                type="file"
                accept=".kml"
                className="hidden"
                onChange={handleKmlChange}
              />
              <span className="text-blue-300 font-semibold mt-2">{kmlFile ? kmlFile.name : "No file selected"}</span>
            </label>
            {kmlError && <div className="text-red-400 mt-2">{kmlError}</div>}
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="px-6 py-2 bg-zinc-700 text-zinc-100 rounded-lg font-semibold"
              onClick={prevStage}
            >
              Back
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              onClick={nextStage}
              disabled={!kmlFile}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* Stage 4: Image Upload */}
      {stage === 4 && (
        <div className="space-y-8">
          <div className="mb-2">
            <span className="block text-lg font-semibold mb-2">Upload Images</span>
            <div className="grid grid-cols-1 gap-6">
              {["Plot Diagram", "Satellite View", "Road Map", "Hybrid View", "Terrain View"].map((label) => {
                if (label === "Plot Diagram") {
                  console.log("[Render] plotPolygon:", plotPolygon);
                  console.log("[Render] imagePreviews['Plot Diagram']:", imagePreviews[label]);
                }
                return (
                  <div key={label} className="space-y-2">
                    <label className="block font-medium mb-1">{label}</label>
                    <label
                      className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors bg-white border-zinc-300 hover:border-blue-500 hover:bg-zinc-100"
                      onDragOver={handleImageDragOver}
                      onDrop={(e) => handleImageDrop(e, label)}
                      htmlFor={`image-upload-${label}`}
                    >
                      <span className="text-zinc-400 mb-2">{label}: Drag & drop or click to upload</span>
                      <input
                        id={`image-upload-${label}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (label === "Plot Diagram") {
                            console.log("Image uploaded for Plot Diagram");
                          }
                          handleImageChange(e, label);
                        }}
                      />
                      {label === "Plot Diagram" && !imagePreviews[label] && plotPolygon.length > 2 ? (
                        (() => {
                          console.log("Rendering SVG for Plot Diagram", plotPolygon);
                          try {
                            // Normalize polygon to fit SVG
                            const lats = plotPolygon.map(([, lat]) => lat);
                            const lngs = plotPolygon.map(([lng]) => lng);
                            const minLat = Math.min(...lats);
                            const maxLat = Math.max(...lats);
                            const minLng = Math.min(...lngs);
                            const maxLng = Math.max(...lngs);
                            const pad = 5; // padding in SVG units
                            const scaleX = (x: number) => ((x - minLng) / (maxLng - minLng || 1)) * (200 - 2 * pad) + pad;
                            // SVG y is down, so invert latitude
                            const scaleY = (y: number) => (200 - pad) - ((y - minLat) / (maxLat - minLat || 1)) * (200 - 2 * pad);
                            const points = plotPolygon.map(([lng, lat]) => `${scaleX(lng)},${scaleY(lat)}`).join(' ');
                            return (
                              <svg
                                ref={plotSvgRef}
                                viewBox="0 0 200 200"
                                width="200"
                                height="200"
                                className="mt-2 rounded shadow max-h-40 object-contain border border-zinc-700 bg-white"
                                style={{ background: 'white' }}
                              >
                                <polygon points={points} fill="#22c55e" stroke="#15803d" strokeWidth="2" />
                                {plotPolygon.map(([lng, lat], idx) => (
                                  <circle
                                    key={idx}
                                    cx={scaleX(lng)}
                                    cy={scaleY(lat)}
                                    r="3"
                                    fill="#dc2626"
                                    stroke="#fff"
                                    strokeWidth="1"
                                  />
                                ))}
                              </svg>
                            );
                          } catch (err) {
                            console.error("Error rendering SVG for Plot Diagram", err, plotPolygon);
                            return <span className="text-red-500">Error rendering plot SVG</span>;
                          }
                        })()
                      ) : label === "Plot Diagram" && !imagePreviews[label] && plotPolygon.length <= 2 ? (
                        <span className="text-yellow-500">No plot polygon data available for SVG preview.</span>
                      ) : imagePreviews[label] ? (
                        <img
                          src={imagePreviews[label]}
                          alt={label + " preview"}
                          className="mt-2 rounded shadow max-h-40 object-contain border border-zinc-700 bg-zinc-900"
                        />
                      ) : (
                        <span className="text-zinc-500 italic mt-2">No image selected</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="px-6 py-2 bg-zinc-700 text-zinc-100 rounded-lg font-semibold"
              onClick={prevStage}
            >
              Back
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
              onClick={nextStage}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* Stage 5: Property Fields Only */}
      {stage === 5 && (
        <form
          className="space-y-8"
          onSubmit={e => {
            e.preventDefault();
            nextStage();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Plot Number</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={plotNumber} onChange={e => setPlotNumber(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Plot Area (m²)</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={plotArea} onChange={e => setPlotArea(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Coordinates</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300"
                  value={coordinates}
                  onChange={e => setCoordinates(e.target.value)}
                  placeholder="Coordinates will appear here after KML upload"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Location</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Municipality</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={municipality} onChange={e => setMunicipality(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Area</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={area} onChange={e => setArea(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Sheet/Plan</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={sheetPlan} onChange={e => setSheetPlan(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Registration No</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={registrationNo} onChange={e => setRegistrationNo(e.target.value)} />
              </div>
            </div>
            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Property Type</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={propertyType} onChange={e => setPropertyType(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Zone</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={zone} onChange={e => setZone(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Zone Description</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={zoneDescription} onChange={e => setZoneDescription(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Building Coefficient</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={buildingCoefficient} onChange={e => setBuildingCoefficient(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Coverage</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={coverage} onChange={e => setCoverage(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Floors</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={floors} onChange={e => setFloors(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium mb-1">Height</label>
                <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Value 2018</label>
                  <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={value2018} onChange={e => setValue2018(e.target.value)} />
                </div>
                <div>
                  <label className="block font-medium mb-1">Value 2021</label>
                  <input type="text" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={value2021} onChange={e => setValue2021(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="px-6 py-2 bg-zinc-700 text-zinc-100 rounded-lg font-semibold"
              onClick={prevStage}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Next
            </button>
          </div>
        </form>
      )}
      {/* Stage 6: Report Meta Fields Only */}
      {stage === 6 && (
        <form
          className="space-y-8"
          onSubmit={e => {
            e.preventDefault();
            nextStage();
          }}
        >
          <div className="border-t border-zinc-700 pt-8">
            <h3 className="text-xl font-bold mb-6 text-zinc-200">Report Details</h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Report Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300"
                    value={reportTitle}
                    onChange={e => {
                      setReportTitle(e.target.value);
                      setReportTitleTouched(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Report Date</label>
                  <input type="date" className="w-full p-2 border rounded-lg bg-white text-zinc-900 border-zinc-300" value={reportDate} onChange={e => setReportDate(e.target.value)} readOnly />
                </div>
                <div>
                  <label className="font-medium mb-1 flex items-center justify-between">
                    Introduction
                    <button
                      type="button"
                      className="ml-2 px-2 py-1 my-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      onClick={() => setShowIntroTemplates(true)}
                    >
                      Templates
                    </button>
                  </label>
                  <textarea className="w-full p-2 border rounded-lg h-20 bg-white text-zinc-900 border-zinc-300" value={introduction} onChange={e => setIntroduction(e.target.value)} />
                </div>
                {/* Modal for Introduction Templates */}
                {showIntroTemplates && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-200 bg-opacity-80">
                    <div className="bg-white border border-zinc-300 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                      <button
                        className="absolute top-2 right-2 text-zinc-400 hover:text-white text-xl font-bold"
                        onClick={() => setShowIntroTemplates(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h4 className="text-lg font-bold mb-4 text-zinc-900">Select a Template</h4>
                      <div className="space-y-3">
                        {INTRO_TEMPLATES.map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="block w-full text-left p-3 rounded bg-white border border-zinc-300 hover:bg-blue-100 text-zinc-900 transition-colors"
                            onClick={() => {
                              setIntroduction(tpl(bankName, reportType));
                              setShowIntroTemplates(false);
                            }}
                          >
                            {tpl(bankName, reportType)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="font-medium mb-1 flex items-center justify-between">
                    Plot Description
                    <button
                      type="button"
                      className="ml-2 px-2 py-1 my-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      onClick={() => setShowPlotDescTemplates(true)}
                    >
                      Templates
                    </button>
                  </label>
                  <textarea className="w-full p-2 border rounded-lg h-20 bg-white text-zinc-900 border-zinc-300" value={plotDescription} onChange={e => setPlotDescription(e.target.value)} />
                </div>
                {/* Modal for Plot Description Templates */}
                {showPlotDescTemplates && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-200 bg-opacity-80">
                    <div className="bg-white border border-zinc-300 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                      <button
                        className="absolute top-2 right-2 text-zinc-400 hover:text-white text-xl font-bold"
                        onClick={() => setShowPlotDescTemplates(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h4 className="text-lg font-bold mb-4 text-zinc-900">Select a Template</h4>
                      <div className="space-y-3">
                        {PLOT_DESC_TEMPLATES.map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="block w-full text-left p-3 rounded bg-white border border-zinc-300 hover:bg-blue-100 text-zinc-900 transition-colors"
                            onClick={() => {
                              setPlotDescription(tpl(reportType));
                              setShowPlotDescTemplates(false);
                            }}
                          >
                            {tpl(reportType)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="font-medium mb-1 flex items-center justify-between">
                    Findings
                    <button
                      type="button"
                      className="ml-2 px-2 py-1 my-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      onClick={() => setShowFindingsTemplates(true)}
                    >
                      Templates
                    </button>
                  </label>
                  <textarea className="w-full p-2 border rounded-lg h-20 bg-white text-zinc-900 border-zinc-300" value={findings} onChange={e => setFindings(e.target.value)} />
                </div>
                {/* Modal for Findings Templates */}
                {showFindingsTemplates && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-200 bg-opacity-80">
                    <div className="bg-white border border-zinc-300 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                      <button
                        className="absolute top-2 right-2 text-zinc-400 hover:text-white text-xl font-bold"
                        onClick={() => setShowFindingsTemplates(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h4 className="text-lg font-bold mb-4 text-zinc-900">Select a Template</h4>
                      <div className="space-y-3">
                        {FINDINGS_TEMPLATES.map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="block w-full text-left p-3 rounded bg-white border border-zinc-300 hover:bg-blue-100 text-zinc-900 transition-colors"
                            onClick={() => {
                              setFindings(tpl(bankName, reportType));
                              setShowFindingsTemplates(false);
                            }}
                          >
                            {tpl(bankName, reportType)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Conclusion field remains full width below */}
          <div className="md:col-span-2 space-y-4 mt-6">
            <div>
              <label className="font-medium mb-1 flex items-center justify-between">
                Conclusion
                <button
                  type="button"
                  className="ml-2 px-2 py-1 my-1 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setShowConclusionTemplates(true)}
                >
                  Templates
                </button>
              </label>
              <textarea className="w-full p-2 border rounded-lg h-20 bg-white text-zinc-900 border-zinc-300" value={conclusion} onChange={e => setConclusion(e.target.value)} />
              {/* Modal for Conclusion Templates */}
              {showConclusionTemplates && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-200 bg-opacity-80">
                  <div className="bg-white border border-zinc-300 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-2 right-2 text-zinc-400 hover:text-white text-xl font-bold"
                      onClick={() => setShowConclusionTemplates(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h4 className="text-lg font-bold mb-4 text-zinc-900">Select a Template</h4>
                    <div className="space-y-3">
                      {CONCLUSION_TEMPLATES.map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="block w-full text-left p-3 rounded bg-white border border-zinc-300 hover:bg-blue-100 text-zinc-900 transition-colors"
                          onClick={() => {
                            setConclusion(tpl(bankName));
                            setShowConclusionTemplates(false);
                          }}
                        >
                          {tpl(bankName)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="px-6 py-2 bg-zinc-700 text-zinc-100 rounded-lg font-semibold"
              onClick={prevStage}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Next
            </button>
          </div>
        </form>
      )}
      {/* Stage 7: Summary */}
      {stage === 7 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Summary</h2>
            <div className="bg-zinc-100 rounded-lg p-4 border border-zinc-300">
              <table className="w-full text-left">
                <tbody>
                  {summaryRows.map(row => (
                    <tr key={row.label} className="border-b border-zinc-300 last:border-b-0">
                      <td className="py-2 pr-4 font-medium text-zinc-700 w-1/3">{row.label}</td>
                      <td className="py-2 text-zinc-900">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-center">Plot Visualization</h3>
            {plotPolygon.length > 2 ? (
              <div className="flex flex-col items-center">
                <svg
                  ref={plotSvgRef}
                  viewBox="0 0 200 200"
                  width="200"
                  height="200"
                  className="rounded shadow max-h-40 object-contain border border-zinc-700 bg-white"
                  style={{ background: 'white' }}
                >
                  {(() => {
                    const lats = plotPolygon.map(([, lat]) => lat);
                    const lngs = plotPolygon.map(([lng]) => lng);
                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);
                    const pad = 5;
                    const scaleX = (x: number) => ((x - minLng) / (maxLng - minLng || 1)) * (200 - 2 * pad) + pad;
                    const scaleY = (y: number) => (200 - pad) - ((y - minLat) / (maxLat - minLat || 1)) * (200 - 2 * pad);
                    const points = plotPolygon.map(([lng, lat]) => `${scaleX(lng)},${scaleY(lat)}`).join(' ');
                    return (
                      <svg
                        ref={plotSvgRef}
                        viewBox="0 0 200 200"
                        width="200"
                        height="200"
                        className="mt-2 rounded shadow max-h-40 object-contain border border-zinc-700 bg-white"
                        style={{ background: 'white' }}
                      >
                        <polygon points={points} fill="#22c55e" stroke="#15803d" strokeWidth="2" />
                        {plotPolygon.map(([lng, lat], idx) => (
                          <circle
                            key={idx}
                            cx={scaleX(lng)}
                            cy={scaleY(lat)}
                            r="3"
                            fill="#dc2626"
                            stroke="#fff"
                            strokeWidth="1"
                          />
                        ))}
                      </svg>
                    );
                  })()}
                </svg>
                <div className="text-center text-zinc-400 text-xs mt-2 max-w-xs">Plot boundary visualization extracted from PAL Surveying mapping system</div>
              </div>
            ) : (
              <div className="text-center text-yellow-500">No plot polygon data available for SVG preview.</div>
            )}
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              className="px-6 py-2 bg-zinc-700 text-zinc-100 rounded-lg font-semibold"
              onClick={prevStage}
            >
              Back
            </button>
            <button
              type="button"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={handleGeneratePDF}
              disabled={pdfGenerating}
            >
              {pdfGenerating ? "Generating PDF..." : "Generate Report"}
            </button>
          </div>
          {pdfGenerating && (
            <div className="text-center text-blue-400 mt-4">Generating PDF, please wait...</div>
          )}
        </div>
      )}
    </div>
  );
}
