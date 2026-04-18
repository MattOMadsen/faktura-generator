const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer');

// Opret PDF-dokument
const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20, color: '#2E8B57' },
  section: { marginBottom: 10 },
  text: { fontSize: 12 },
  bold: { fontWeight: 'bold' },
});

const generatePDF = (invoiceData) => {
  return (
    <Document>
      <Page style={styles.page}>
        <View>
          <Text style={styles.title}>Faktura</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Kunde:</Text> {invoiceData.customerName}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>E-mail:</Text> {invoiceData.customerEmail}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Beløb (ekskl. moms):</Text> {invoiceData.amount} DKK
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Moms (25%):</Text> {invoiceData.amount * 0.25} DKK
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>I alt:</Text> {invoiceData.amount * 1.25} DKK
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Forfaldsdato:</Text> {invoiceData.dueDate}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Beskrivelse:</Text> {invoiceData.description}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

module.exports = { generatePDF };