import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset, type PdfAssetKey } from "./pdf.assets";
import { pdfStyles } from "./pdf.styles";

const IMPACT_ICONS: PdfAssetKey[] = ["family", "trees", "truck", "children"];

export default function PdfImpact({ data }: { data: WaterWarriorsPdfData }) {
  return (
    <View>
      <Text style={pdfStyles.pageTitle}>{data.impact.title}</Text>
      <Text style={[pdfStyles.muted, { fontSize: 8 }]}>
        {data.impact.description}
      </Text>

      <View style={pdfStyles.impactRow} wrap={false}>
        {data.impact.items.map((item, index) => (
          <View key={`${item.label}-${index}`} style={pdfStyles.impactItem}>
            <View style={pdfStyles.impactCard}>
              <Text style={pdfStyles.impactLabel}>{item.label}</Text>
              <Text style={pdfStyles.impactValue}>{item.value}</Text>
              <Text style={pdfStyles.impactNote}>{item.note}</Text>
            </View>
            <View style={pdfStyles.impactIconWrap}>
              <PdfImage
                src={resolveAsset(
                  data.assets,
                  IMPACT_ICONS[index % IMPACT_ICONS.length],
                )}
                style={pdfStyles.impactIcon}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={pdfStyles.assumptionsBox} wrap={false}>
        <Text style={pdfStyles.assumptionsText}>{data.impact.assumptions}</Text>
      </View>
    </View>
  );
}
