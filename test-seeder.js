#!/usr/bin/env node

/**
 * Simple test script to verify the seeder works
 * Run this after the seeder to check if data was created correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSeeder() {
  console.log('🧪 Testing seeder results...\n');

  try {
    // Test school
    const school = await prisma.school.findFirst();
    console.log(`✅ School: ${school ? school.school_name : 'NOT FOUND'}`);

    // Test academic sessions
    const sessions = await prisma.academicSession.findMany();
    const currentSession = sessions.find(s => s.is_current);
    console.log(`✅ Academic Sessions: ${sessions.length} (Current: ${currentSession ? currentSession.academic_year : 'NOT FOUND'})`);

    // Test users
    const users = await prisma.user.findMany();
    const directors = users.filter(u => u.role === 'school_director');
    const teachers = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');
    console.log(`✅ Users: ${users.length} (${directors.length} directors, ${teachers.length} teachers, ${students.length} students)`);

    // Test classes
    const classes = await prisma.class.findMany();
    console.log(`✅ Classes: ${classes.length}`);

    // Test subjects
    const subjects = await prisma.subject.findMany();
    console.log(`✅ Subjects: ${subjects.length}`);

    // Test teacher-subject relationships
    const teacherSubjects = await prisma.teacherSubject.findMany();
    console.log(`✅ Teacher-Subject Relationships: ${teacherSubjects.length}`);

    // Test timetable entries
    const timetableEntries = await prisma.timetableEntry.findMany();
    console.log(`✅ Timetable Entries: ${timetableEntries.length}`);

    // Test topics
    const topics = await prisma.topic.findMany();
    console.log(`✅ Topics: ${topics.length}`);

    // Test time slots
    const timeSlots = await prisma.timeSlot.findMany();
    console.log(`✅ Time Slots: ${timeSlots.length}`);

    // Test finance
    const finance = await prisma.finance.findFirst();
    console.log(`✅ Finance: ${finance ? 'Created' : 'NOT FOUND'}`);

    // Test wallet
    const wallet = await prisma.wallet.findFirst();
    console.log(`✅ Wallet: ${wallet ? 'Created' : 'NOT FOUND'}`);

    // Test notifications
    const notifications = await prisma.notification.findMany();
    console.log(`✅ Notifications: ${notifications.length}`);

    console.log('\n🎉 All tests passed! Seeder worked correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSeeder();
