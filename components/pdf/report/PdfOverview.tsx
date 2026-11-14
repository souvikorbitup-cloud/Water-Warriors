import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { pdfStyles } from "./pdf.styles";

export default function PdfOverview({ data }: { data: WaterWarriorsPdfData }) {
  const { overview } = data;

  return (
    <View>
      {data.mapImageUrl ? (
        <PdfImage src={data.mapImageUrl} style={pdfStyles.map} />
      ) : (
        <View style={pdfStyles.mapPlaceholder}>
          <Text style={pdfStyles.muted}>Map preview unavailable</Text>
        </View>
      )}

      <View style={pdfStyles.statCard}>
        <View>
          <Text style={pdfStyles.statLabel}>{overview.catchmentLabel}</Text>
          <Text style={pdfStyles.statValue}>{overview.catchmentArea}</Text>
        </View>
      </View>

      <View style={pdfStyles.statCard}>
        <View>
          <Text style={pdfStyles.statLabel}>{overview.rainfallLabel}</Text>
          <Text style={pdfStyles.statValue}>{overview.annualRainfall}</Text>
        </View>
      </View>

      <View style={pdfStyles.potentialCard}>
        <Text style={pdfStyles.sectionTitle}>{overview.potentialTitle}</Text>
        <Text style={pdfStyles.muted}>{overview.potentialDescription}</Text>
        <Text style={pdfStyles.potentialValue}>{overview.potentialValue}</Text>
        {overview.potentialInWords ? (
          <Text style={pdfStyles.smallText}>{overview.potentialInWords}</Text>
        ) : null}
        {overview.calculation ? (
          <Text style={pdfStyles.smallText}>{overview.calculation}</Text>
        ) : null}
        {overview.source ? (
          <Text style={pdfStyles.smallText}>{overview.source}</Text>
        ) : null}
      </View>
    </View>
  );
}
