import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { resolveAsset } from "./pdf.assets";
import { pdfStyles } from "./pdf.styles";

const DEFAULT_PDF_NOTICE =
  "All proprietary technology and processes featured on this site are protected under national and international patent pending status. Unauthorized reproduction or use is strictly prohibited.";

export default function PdfHeader({ data }: { data: WaterWarriorsPdfData }) {
  return (
    <View>
      <View style={pdfStyles.noticeBar}>
        <Text style={pdfStyles.noticeText}>
          {data.notice ?? DEFAULT_PDF_NOTICE}
        </Text>
      </View>
      <View style={pdfStyles.brandRow}>
        <PdfImage
          src={resolveAsset(data.assets, "logo")}
          style={pdfStyles.brandMark}
        />
      </View>
    </View>
  );
}
