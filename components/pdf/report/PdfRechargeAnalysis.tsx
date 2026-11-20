import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset } from "./pdf.assets";
import { pdfStyles } from "./pdf.styles";
import { splitReportText } from "@/lib/report/highlight-text";

function renderHighlightedText(
  text: string,
  terms: string[] = [],
  useLegacyFallback = false,
) {
  return splitReportText(text, useLegacyFallback ? terms : []).map(
    (segment, index) =>
      segment.emphasize ? (
        <Text key={index} style={{ fontWeight: 700 }}>
          {segment.text}
        </Text>
      ) : (
        segment.text
      ),
  );
}

export default function PdfRechargeAnalysis({
  data,
}: {
  data: WaterWarriorsPdfData;
}) {
  const importantTerms = [
    ...data.location.split(","),
    data.overview.catchmentArea,
  ];

  return (
    <View>
      <PdfImage
        src={data.rechargeBannerUrl || resolveAsset(data.assets, "divider")}
        style={pdfStyles.rechargeBanner}
      />

      <Text style={pdfStyles.rechargeTitle}>{data.recharge.title}</Text>

      {data.recharge.introduction ? (
        <Text style={pdfStyles.rechargeIntro}>
          {renderHighlightedText(
            data.recharge.introduction,
            importantTerms,
            true,
          )}
        </Text>
      ) : null}

      {data.recharge.paragraphs.map((paragraph, index) => (
        <View key={`analysis-${index}`} style={pdfStyles.quote} wrap={false}>
          <Text style={pdfStyles.quoteText} orphans={2} widows={2}>
            {renderHighlightedText(paragraph, importantTerms, true)}
          </Text>
        </View>
      ))}
    </View>
  );
}
