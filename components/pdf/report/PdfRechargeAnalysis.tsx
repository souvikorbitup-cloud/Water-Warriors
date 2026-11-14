import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset } from "./pdf.assets";
import { pdfStyles } from "./pdf.styles";

export default function PdfRechargeAnalysis({
  data,
}: {
  data: WaterWarriorsPdfData;
}) {
  return (
    <View>
      <PdfImage
        src={data.rechargeBannerUrl || resolveAsset(data.assets, "divider")}
        style={pdfStyles.rechargeBanner}
      />

      <Text style={pdfStyles.rechargeTitle}>{data.recharge.title}</Text>

      {data.recharge.introduction ? (
        <Text style={pdfStyles.rechargeIntro}>
          {data.recharge.introduction}
        </Text>
      ) : null}

      {data.recharge.paragraphs.map((paragraph, index) => (
        <View key={`analysis-${index}`} style={pdfStyles.quote} wrap={false}>
          <Text style={pdfStyles.quoteText} orphans={2} widows={2}>
            {paragraph}
          </Text>
        </View>
      ))}
    </View>
  );
}
