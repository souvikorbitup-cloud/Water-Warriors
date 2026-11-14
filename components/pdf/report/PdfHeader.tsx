import { Image as PdfImage, Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "./pdf.styles";

export default function PdfHeader() {
  return (
    <View style={pdfStyles.brandRow}>
      <PdfImage src="/section-images/w-logo.svg" style={pdfStyles.brandMark} />
      <Text style={pdfStyles.brand}>WATER WARRIORS.AI</Text>
    </View>
  );
}
