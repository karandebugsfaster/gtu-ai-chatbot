// import { NextResponse } from 'next/server';
// import connectDB from '@/lib/db/mongodb';
// import Document from '@/lib/db/models/Document';
// import PYQ from '@/lib/db/models/PYQ';

// export async function GET(request) {
//   try {
//     await connectDB();

//     const { searchParams } = new URL(request.url);
//     const subjectId = searchParams.get('subjectId');

//     if (!subjectId) {
//       return NextResponse.json(
//         { success: false, error: 'Subject ID is required' },
//         { status: 400 }
//       );
//     }

//     // Fetch all resource types for this subject
//     const [books, notes, references, pyqs] = await Promise.all([
//       Document.find({
//         subject: subjectId,
//         type: 'book',
//         processingStatus: 'completed',
//         isActive: true
//       })
//       .select('title fileDetails metadata downloads views createdAt')
//       .sort({ createdAt: -1 })
//       .lean(),

//       Document.find({
//         subject: subjectId,
//         type: 'notes',
//         processingStatus: 'completed',
//         isActive: true
//       })
//       .select('title fileDetails metadata downloads views createdAt')
//       .sort({ createdAt: -1 })
//       .lean(),

//       Document.find({
//         subject: subjectId,
//         type: 'reference',
//         processingStatus: 'completed',
//         isActive: true
//       })
//       .select('title fileDetails metadata downloads views createdAt')
//       .sort({ createdAt: -1 })
//       .lean(),

//       PYQ.find({
//         subject: subjectId,
//         processingStatus: 'completed',
//         isActive: true
//       })
//       .select('examName academicYear examDate examType totalMarks fileDetails downloads')
//       .sort({ examDate: -1 })
//       .lean()
//     ]);

//     return NextResponse.json({
//       success: true,
//       resources: {
//         books,
//         notes,
//         references,
//         pyqs
//       },
//       counts: {
//         books: books.length,
//         notes: notes.length,
//         references: references.length,
//         pyqs: pyqs.length
//       }
//     });

//   } catch (error) {
//     console.error('Get resources error:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to fetch resources' },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Document from '@/lib/db/models/Document';

// Public API - no auth required for browsing
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type     = searchParams.get('type');     // 'pyq','notes','book','reference'
    const branch   = searchParams.get('branch');
    const semester = searchParams.get('semester');
    const subject  = searchParams.get('subject');
    const year     = searchParams.get('year');
    const search   = searchParams.get('search');

    const query = { processingStatus: { $ne: 'failed' } };
    if (type)     query.type     = type;
    if (branch)   query.branch   = branch;
    if (semester) query.semester = Number(semester);
    if (year)     query.academicYear = year;

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { author:  { $regex: search, $options: 'i' } },
      ];
    }

    const documents = await Document.find(query)
      .select('-fileData') // never send raw base64 in list
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('[gtu/resources] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}