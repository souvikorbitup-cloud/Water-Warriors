import { Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { pdfStyles } from "./pdf.styles";

export default function PdfImpact({ data }: { data: WaterWarriorsPdfData }) {
  return (
    <View>
      <Text style={pdfStyles.pageTitle}>{data.impact.title}</Text>
      <Text style={pdfStyles.muted}>{data.impact.description}</Text>

      <View style={pdfStyles.impactGrid}>
        {data.impact.items.map((item, index) => (
          <View
            key={`${item.label}-${index}`}
            style={pdfStyles.impactCard}
            wrap={false}
          >
            <Text style={pdfStyles.impactLabel}>{item.label}</Text>
            <Text style={pdfStyles.impactValue}>{item.value}</Text>
            <Text style={pdfStyles.impactNote}>{item.note}</Text>
          </View>
        ))}
      </View>

      <Text style={pdfStyles.assumptions}>{data.impact.assumptions}</Text>
    </View>
  );
}
