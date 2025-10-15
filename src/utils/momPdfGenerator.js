import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoSvgBase64 } from './logoSvg';

export const generateMomPDF = async (momData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 15;

  // Helper function to format role names
  const formatRole = (role) => {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Add SVG logo
  try {
    const logoSvg = await getLogoSvgBase64();
    doc.addImage(logoSvg, 'PNG', pageWidth - 60, 12, 50, 9);
  } catch (error) {
    console.error('Logo error:', error);
    // Fallback to text if logo fails to load
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('goPhygital.work', pageWidth - 60, 20);
  }
  
  yPosition += 15;

  // Title - Dynamic from JSON
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  const title = momData.title || 'Minutes of Meeting';
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Header Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Two-column layout with better spacing
  const leftColumn = margin;
  const rightColumn = pageWidth / 2 + 5;
  const labelWidth = 48;
  
  // Row 1: Community and Date
  doc.setFont('helvetica', 'bold');
  doc.text('Community', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${momData.resource_type || 'N/A'}`, leftColumn + labelWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  const meetingDate = momData.meeting_date ? new Date(momData.meeting_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : 'N/A';
  doc.text(`: ${meetingDate}`, rightColumn + labelWidth, yPosition);
  
  yPosition += 7;

  // Row 2: Meeting Type and Meeting Mode (if available)
  if (momData.meeting_type || momData.meeting_mode) {
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Type', leftColumn, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${momData.meeting_type ? momData.meeting_type.charAt(0).toUpperCase() + momData.meeting_type.slice(1) : 'N/A'}`, leftColumn + labelWidth, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Mode', rightColumn, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${momData.meeting_mode ? momData.meeting_mode.charAt(0).toUpperCase() + momData.meeting_mode.slice(1) : 'N/A'}`, rightColumn + labelWidth, yPosition);
    
    yPosition += 7;
  }

  // Row 3: Minutes Prepared By
  doc.setFont('helvetica', 'bold');
  doc.text('Minutes Prepared By', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${momData.responsible_person?.name || 'N/A'}`, leftColumn + labelWidth, yPosition);
  
  yPosition += 12;

  // List of Attendees Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('List of Attendees', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Attendees Table
  const attendeesData = momData.mom_attendees?.map(attendee => [
    attendee.name || '',
    attendee.email || '',
    formatRole(attendee.role),
    attendee.organization || ''
  ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [['Name', 'Email', 'Role', 'Organization']],
    body: attendeesData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      halign: 'center',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 }
    }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Discussion Points Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Discussion Points', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Discussion Points Table
  const discussionData = momData.mom_tasks?.map((task, index) => [
    `${index + 1}`,
    task.description || '',
    task.responsible_person_name || '',
    task.target_date ? new Date(task.target_date).toLocaleDateString('en-GB') : '',
    task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : ''
  ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Description', 'Accountability', 'Target Date', 'Status']],
    body: discussionData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 85, halign: 'left' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' }
    },
    didParseCell: function(data) {
      // Color code status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw.toLowerCase();
        if (status === 'completed' || status === 'closed') {
          data.cell.styles.textColor = [0, 128, 0]; // Green
        } else if (status === 'in progress' || status.includes('progress')) {
          data.cell.styles.textColor = [255, 140, 0]; // Orange
        } else {
          data.cell.styles.textColor = [200, 0, 0]; // Red
        }
      }
    }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Footer disclaimer
  if (yPosition > pageHeight - 30) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const disclaimer = "The above notes constitute the writer's understanding of the meeting content. If there are any errors,";
  const disclaimer2 = "omissions or discrepancies please notify the writer within 24 hours of distribution.";
  doc.text(disclaimer, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(disclaimer2, pageWidth / 2, yPosition + 5, { align: 'center' });

  // Save the PDF
  const fileName = `MOM_${momData.id || 'document'}_${meetingDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

// Alternative: Generate PDF with full description details
export const generateDetailedMomPDF = async (momData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  // Helper function to format role names
  const formatRole = (role) => {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Add SVG logo
  try {
    const logoSvg = await getLogoSvgBase64();
    doc.addImage(logoSvg, 'PNG', pageWidth - 60, 12, 50, 9);
  } catch (error) {
    console.error('Logo error:', error);
    // Fallback to text if logo fails to load
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('goPhygital.work', pageWidth - 60, 20);
  }
  
  yPosition += 15;

  // Title - Dynamic from JSON
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  const title = momData.title || 'Minutes of Meeting';
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Header Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const leftColumn = margin;
  const rightColumn = pageWidth / 2 + 10;
  const labelWidth = 48;
  
  // Community and Date
  doc.setFont('helvetica', 'bold');
  doc.text('Community', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${momData.resource_type || 'N/A'}`, leftColumn + labelWidth, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date', rightColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  const meetingDate = momData.meeting_date ? new Date(momData.meeting_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : 'N/A';
  doc.text(`: ${meetingDate}`, rightColumn + labelWidth, yPosition);
  
  yPosition += 7;

  // Meeting Type and Meeting Mode (if available)
  if (momData.meeting_type || momData.meeting_mode) {
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Type', leftColumn, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${momData.meeting_type ? momData.meeting_type.charAt(0).toUpperCase() + momData.meeting_type.slice(1) : 'N/A'}`, leftColumn + labelWidth, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Mode', rightColumn, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${momData.meeting_mode ? momData.meeting_mode.charAt(0).toUpperCase() + momData.meeting_mode.slice(1) : 'N/A'}`, rightColumn + labelWidth, yPosition);
    
    yPosition += 7;
  }

  // Minutes Prepared By
  doc.setFont('helvetica', 'bold');
  doc.text('Minutes Prepared By', leftColumn, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${momData.responsible_person?.name || 'N/A'}`, leftColumn + labelWidth, yPosition);
  
  yPosition += 12;

  // List of Attendees
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('List of Attendees', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Attendees Table
  const attendeesData = momData.mom_attendees?.map(attendee => [
    attendee.name || '',
    attendee.email || '',
    formatRole(attendee.role),
    attendee.organization || ''
  ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [['Name', 'Email', 'Role', 'Organization']],
    body: attendeesData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      halign: 'center',
      fontSize: 9
    }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Discussion Points with full descriptions in table format
  checkPageBreak(20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Discussion Points', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Discussion Points Table with full descriptions
  const discussionData = momData.mom_tasks?.map((task, index) => [
    `${index + 1}`,
    task.description || '',
    task.responsible_person_name || '',
    task.target_date ? new Date(task.target_date).toLocaleDateString('en-GB') : '',
    task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : ''
  ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Description', 'Accountability', 'Target Date', 'Status']],
    body: discussionData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 85, halign: 'left' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' }
    },
    didParseCell: function(data) {
      // Color code status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw.toLowerCase();
        if (status === 'completed' || status === 'closed') {
          data.cell.styles.textColor = [0, 128, 0]; // Green
        } else if (status === 'in progress' || status.includes('progress')) {
          data.cell.styles.textColor = [255, 140, 0]; // Orange
        } else {
          data.cell.styles.textColor = [200, 0, 0]; // Red
        }
      }
    }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Footer
  checkPageBreak(15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const disclaimer = "The above notes constitute the writer's understanding of the meeting content. If there are any errors,";
  const disclaimer2 = "omissions or discrepancies please notify the writer within 24 hours of distribution.";
  doc.text(disclaimer, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(disclaimer2, pageWidth / 2, yPosition + 5, { align: 'center' });

  // Save
  const fileName = `MOM_${momData.id || 'document'}_${meetingDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
