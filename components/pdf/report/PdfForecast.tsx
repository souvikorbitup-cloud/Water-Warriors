import { Text, View } from "@react-pdf/renderer";
import type { WaterWarriorsPdfData } from "./pdf.types";
import { pdfStyles, PDF_COLORS } from "./pdf.styles";

export default function PdfForecast({ data }: { data: WaterWarriorsPdfData }) {
  const { forecast } = data;

  return (
    <View>
      <Text style={pdfStyles.pageTitle}>{forecast.title}</Text>
      <Text style={pdfStyles.muted}>{forecast.period}</Text>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader} wrap={false}>
          <Text style={[pdfStyles.tableCellMonth, pdfStyles.tableHeaderText]}>
            {forecast.monthLabel}
          </Text>
          <Text
            style={[pdfStyles.tableCellRainfall, pdfStyles.tableHeaderText]}
          >
            {forecast.rainfallLabel}
          </Text>
          <Text
            style={[pdfStyles.tableCellPotential, pdfStyles.tableHeaderText]}
          >
            {forecast.potentialLabel}
          </Text>
        </View>

        {forecast.rows.length ? (
          forecast.rows.map((row, index) => (
            <View
              key={`${row.month}-${index}`}
              style={[
                pdfStyles.tableRow,
                row.highlight ? pdfStyles.totalRow : {},
              ]}
              wrap={false}
            >
              <Text
                style={[
                  pdfStyles.tableCellMonth,
                  row.highlight ? { fontWeight: 700 } : {},
                ]}
              >
                {row.month}
              </Text>
              <Text
                style={[
                  pdfStyles.tableCellRainfall,
                  row.highlight ? { fontWeight: 700 } : {},
                ]}
              >
                {row.rainfall}
              </Text>
              <Text
                style={[
                  pdfStyles.tableCellPotential,
                  row.highlight ? { fontWeight: 700 } : {},
                ]}
              >
                {row.potential}
              </Text>
            </View>
          ))
        ) : (
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.muted}>{forecast.pendingLabel}</Text>
          </View>
        )}
      </View>

      <View style={pdfStyles.tipBox} wrap={false}>
        <Text style={pdfStyles.tipMark}>✳</Text>
        <Text style={[pdfStyles.muted, { flex: 1 }]}>{forecast.tip}</Text>
      </View>

      <Text style={pdfStyles.smallText}>{forecast.note}</Text>
      <Text
        style={[
          pdfStyles.smallText,
          { fontWeight: 700, color: PDF_COLORS.ink },
        ]}
      >
        {forecast.source}
      </Text>

      <Text
        style={[pdfStyles.smallText, { marginTop: 22, textAlign: "center" }]}
      >
        {forecast.disclaimer}
      </Text>
    </View>
  );
}
