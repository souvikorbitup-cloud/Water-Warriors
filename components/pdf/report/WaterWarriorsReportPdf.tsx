import { Document, Font, Page, Text, View } from "@react-pdf/renderer";

import type { WaterWarriorsPdfData } from "./pdf.types";
import PdfHeader from "./PdfHeader";
import PdfOverview from "./PdfOverview";
import PdfPotential from "./PdfPotential";
import PdfImpact from "./PdfImpact";
import PdfRechargeAnalysis from "./PdfRechargeAnalysis";
import PdfForecast from "./PdfForecast";
import { pdfStyles } from "./pdf.styles";

let registeredFonts = false;

function registerReportFonts() {
  if (registeredFonts) return;

  Font.register({
    family: "WWNotoSans",
    fonts: [
      { src: "/fonts/noto-sans-latin-400-normal.woff", fontWeight: 400 },
      { src: "/fonts/noto-sans-latin-700-normal.woff", fontWeight: 700 },
    ],
  });
  Font.register({
    family: "WWNotoSansDevanagari",
    fonts: [
      {
        src: "/fonts/noto-sans-devanagari-400-normal.woff",
        fontWeight: 400,
      },
      {
        src: "/fonts/noto-sans-devanagari-700-normal.woff",
        fontWeight: 700,
      },
    ],
  });
  Font.register({
    family: "WWNotoSansBengali",
    fonts: [
      {
        src: "/fonts/noto-sans-bengali-bengali-400-normal.woff",
        fontWeight: 400,
      },
      {
        src: "/fonts/noto-sans-bengali-bengali-700-normal.woff",
        fontWeight: 700,
      },
    ],
  });
  registeredFonts = true;
}

function getFontFamily(locale: string): string | string[] {
  if (locale.startsWith("bn")) {
    return ["WWNotoSansBengali", "WWNotoSans"];
  }
  if (locale.startsWith("hi")) {
    return ["WWNotoSansDevanagari", "WWNotoSans"];
  }
  return "WWNotoSans";
}

function PageFooter() {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>WATER WARRIORS.AI</Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export default function WaterWarriorsReportPdf({
  data,
}: {
  data: WaterWarriorsPdfData;
}) {
  registerReportFonts();
  const fontFamily = getFontFamily(data.locale);
  const pageStyle = [pdfStyles.page, { fontFamily }];

  return (
    <Document
      title="Water Warriors - Rainwater Harvesting Report"
      author="Water Warriors AI"
      subject="Rainwater harvesting potential and forecast report"
      language={data.locale}
    >
      {/* Page 1: header, greeting, map, stats, potential */}
      <Page size="A4" style={pageStyle} wrap>
        <PdfHeader data={data} />
        <Text style={pdfStyles.greeting}>{data.greeting}</Text>
        <Text style={pdfStyles.thankYou}>{data.thankYou}</Text>
        <PdfOverview data={data} />
        <PdfPotential data={data} />
        <PageFooter />
      </Page>

      {/* Page 2: impact */}
      <Page size="A4" style={pageStyle} wrap>
        <View style={pdfStyles.contentTop}>
          <PdfImpact data={data} />
        </View>
        <PageFooter />
      </Page>

      {/* Page 3: recharge analysis */}
      <Page size="A4" style={pageStyle} wrap>
        <PdfRechargeAnalysis data={data} />
        <PageFooter />
      </Page>

      {/* Page 4: forecast */}
      <Page size="A4" style={pageStyle} wrap>
        <PdfForecast data={data} />
        <PageFooter />
      </Page>
    </Document>
  );
}
