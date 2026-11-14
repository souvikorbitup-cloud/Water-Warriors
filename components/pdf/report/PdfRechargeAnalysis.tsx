import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { pdfStyles } from "./pdf.styles";

export default function PdfRechargeAnalysis({
  data,
}: {
  data: WaterWarriorsPdfData;
}) {
  return (
    <View>
      <View>
        {data.rechargeBannerUrl ? (
          <PdfImage
            src={data.rechargeBannerUrl}
            style={pdfStyles.rechargeBanner}
          />
        ) : null}
        <Text style={pdfStyles.rechargeTitleOverlay}>
          {data.recharge.title}
        </Text>
      </View>

      {data.recharge.introduction ? (
        <Text style={pdfStyles.paragraph}>{data.recharge.introduction}</Text>
      ) : null}

      {data.recharge.paragraphs.map((paragraph, index) => (
        <Text
          key={`analysis-${index}`}
          style={pdfStyles.paragraph}
          orphans={2}
          widows={2}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}
