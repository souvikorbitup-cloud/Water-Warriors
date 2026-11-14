import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset } from "./pdf.assets";
import { pdfStyles } from "./pdf.styles";

const DEFAULT_CAPTION =
  "From rainfall to a resource: a different way to look at the water that reaches your roof.";

export default function PdfPotential({ data }: { data: WaterWarriorsPdfData }) {
  const { overview } = data;

  return (
    <View style={pdfStyles.potentialSection} wrap={false}>
      <PdfImage
        src={resolveAsset(data.assets, "gradient")}
        style={pdfStyles.sectionBg}
      />

      <View style={pdfStyles.potentialRow}>
        <View style={pdfStyles.potentialCol}>
          <Text style={pdfStyles.sectionTitle}>{overview.potentialTitle}</Text>
          <Text style={pdfStyles.potentialDescription}>
            {overview.potentialDescription}
          </Text>

          <View style={pdfStyles.potentialPill}>
            <View style={pdfStyles.potentialSheen} />
            <PdfImage
              src={resolveAsset(data.assets, "drop")}
              style={pdfStyles.potentialIcon}
            />
            <View>
              <Text style={pdfStyles.potentialLabel}>
                {overview.potentialLabel ?? overview.catchmentLabel}
              </Text>
              <Text style={pdfStyles.potentialValue}>
                {overview.potentialValue}
              </Text>
            </View>
          </View>

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

        <View style={pdfStyles.potentialCol}>
          <PdfImage
            src={resolveAsset(data.assets, "rainCollect")}
            style={pdfStyles.rainImage}
          />
          <Text style={pdfStyles.imageCaption}>
            {overview.imageCaption ?? DEFAULT_CAPTION}
          </Text>
        </View>
      </View>
    </View>
  );
}
