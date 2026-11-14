import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset } from "./pdf.assets";
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

      <View style={pdfStyles.statRow} wrap={false}>
        <View style={pdfStyles.statCard}>
          <PdfImage
            src={resolveAsset(data.assets, "house")}
            style={pdfStyles.statIcon}
          />
          <View>
            <Text style={pdfStyles.statLabel}>{overview.catchmentLabel}</Text>
            <Text style={pdfStyles.statValue}>{overview.catchmentArea}</Text>
          </View>
        </View>

        <View style={pdfStyles.statCard}>
          <PdfImage
            src={resolveAsset(data.assets, "rain")}
            style={pdfStyles.statIcon}
          />
          <View>
            <Text style={pdfStyles.statLabel}>{overview.rainfallLabel}</Text>
            <Text style={pdfStyles.statValue}>{overview.annualRainfall}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
