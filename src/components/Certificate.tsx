import { Certificate } from "@/lib/certificateManager";
import { Award, Download } from "lucide-react";
import { Button } from "./ui/button";

interface CertificateProps {
  certificate: Certificate;
}

export const CertificateComponent = ({ certificate }: CertificateProps) => {
  const handleDownload = () => {
    const element = document.getElementById('certificate-content');
    if (!element) return;

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return;

    const styles = `
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .certificate-print {
          width: 1000px;
          margin: 0 auto;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    `;

    printWindow.document.write(styles + '<div class="certificate-print">' + element.innerHTML + '</div>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      <div className="flex justify-end mb-4 no-print">
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download Certificate
        </Button>
      </div>

      <div id="certificate-content" className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 p-12 rounded-lg shadow-2xl border-8 border-double border-primary/20">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-primary/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-primary/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-primary/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-primary/30 rounded-br-lg" />

        {/* Inner Content */}
        <div className="relative bg-background/95 backdrop-blur-sm p-16 rounded-lg border border-primary/10 shadow-lg">
          {/* Header */}
          <div className="flex items-start justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Award className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">LearningHub</h1>
                <p className="text-sm text-muted-foreground">Certificate of Completion</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Award className="h-12 w-12 text-primary-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mt-2">Workshop</p>
              <p className="text-xs text-muted-foreground">Certificate</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center space-y-8 mb-16">
            <p className="text-lg text-muted-foreground">This certificate is awarded to</p>
            
            <h2 className="text-6xl font-bold text-foreground tracking-tight">
              {certificate.studentName}
            </h2>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                For successfully completing the workshop
              </p>
              <h3 className="text-3xl font-semibold text-foreground">
                {certificate.workshopTitle}
              </h3>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between pt-12 border-t border-border">
            <div>
              <p className="text-xl font-semibold text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">Date of Completion</p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-signature text-foreground mb-1" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                {certificate.instructorName}
              </p>
              <p className="text-sm text-muted-foreground">
                {certificate.instructorName}, Workshop Instructor
              </p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              Certificate ID: {certificate.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
