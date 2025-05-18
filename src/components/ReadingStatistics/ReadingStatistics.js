import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { format, subDays, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
);

const ReadingStatistics = () => {
  const { state } = useContext(AppContext);
  const { articles, statistics } = state;
  
  const [tabValue, setTabValue] = useState(0);
  const [categoryData, setCategoryData] = useState({ labels: [], datasets: [] });
  const [timeOfDayData, setTimeOfDayData] = useState({ labels: [], datasets: [] });
  const [dailyReadingData, setDailyReadingData] = useState({ labels: [], datasets: [] });
  const [readingStreak, setReadingStreak] = useState(0);
  const [topCategories, setTopCategories] = useState([]);
  
  useEffect(() => {
    // Process data for visualizations
    processData();
  }, [articles, statistics, processData]);
  
  const processData = () => {
    // 1. Category breakdown data for pie chart
    processCategoryData();
    
    // 2. Time of day reading habits
    processTimeOfDayData();
    
    // 3. Daily reading tracking for line chart
    processDailyReadingData();
    
    // 4. Calculate reading streak
    calculateReadingStreak();
    
    // 5. Get top categories
    getTopCategories();
  };
  
  const processCategoryData = () => {
    const categoryCounts = {};
    const categoryColors = {};
    const colorPalette = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#C9CBCF', '#7FC97F', '#BEAED4', '#FDC086'
    ];
    
    // Count articles by category
    articles.filter(article => article.isRead).forEach(article => {
      const category = article.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Assign consistent colors to categories
      if (!categoryColors[category]) {
        const colorIndex = Object.keys(categoryColors).length % colorPalette.length;
        categoryColors[category] = colorPalette[colorIndex];
      }
    });
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    const backgroundColor = labels.map(label => categoryColors[label]);
    
    setCategoryData({
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1
        }
      ]
    });
  };
  
  const processTimeOfDayData = () => {
    const hourCounts = Array(24).fill(0);
    
    // Count articles by hour of day they were read
    articles
      .filter(article => article.isRead && article.readDate)
      .forEach(article => {
        const hour = new Date(article.readDate).getHours();
        hourCounts[hour]++;
      });
    
    setTimeOfDayData({
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Articles Read',
          data: hourCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    });
  };
  
  const processDailyReadingData = () => {
    // Get reading data for the last 14 days
    const today = new Date();
    const twoWeeksAgo = subDays(today, 13);
    
    // Create an array of dates
    const dateRange = eachDayOfInterval({ start: twoWeeksAgo, end: today });
    
    // Initialize counts for articles and reading time
    const articleCounts = dateRange.map(() => 0);
    const readingTimes = dateRange.map(() => 0);
    
    // Count articles by day
    articles
      .filter(article => article.isRead && article.readDate)
      .forEach(article => {
        const readDate = parseISO(article.readDate);
        const dayIndex = dateRange.findIndex(day => 
          readDate >= startOfDay(day) && readDate <= endOfDay(day)
        );
        
        if (dayIndex >= 0) {
          articleCounts[dayIndex]++;
          readingTimes[dayIndex] += article.actualReadingTime || 0;
        }
      });
    
    setDailyReadingData({
      labels: dateRange.map(date => format(date, 'MMM d')),
      datasets: [
        {
          label: 'Articles Read',
          data: articleCounts,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Reading Time (min)',
          data: readingTimes.map(time => Math.round(time / 60)),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1'
        }
      ]
    });
  };
  
  const calculateReadingStreak = () => {
    // Get all read dates
    const readDates = articles
      .filter(article => article.isRead && article.readDate)
      .map(article => format(parseISO(article.readDate), 'yyyy-MM-dd'));
    
    // Deduplicate dates
    const uniqueDates = [...new Set(readDates)].sort();
    
    if (uniqueDates.length === 0) {
      setReadingStreak(0);
      return;
    }
    
    // Check if today has reading activity
    const today = format(new Date(), 'yyyy-MM-dd');
    const hasReadToday = uniqueDates.includes(today);
    
    // Calculate streak
    let streak = hasReadToday ? 1 : 0;
    if (streak > 0) {
      for (let i = 1; i < 365; i++) {
        const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (uniqueDates.includes(checkDate)) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    setReadingStreak(streak);
  };
  
  const getTopCategories = () => {
    const categoryCounts = {};
    
    // Count articles by category
    articles.filter(article => article.isRead).forEach(article => {
      const category = article.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Sort categories by count
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
    
    setTopCategories(sortedCategories);
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const getTotalReadingTime = () => {
    const totalMinutes = Math.round(statistics.totalReadingTime / 60) || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reading Statistics
      </Typography>
      
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Grid container spacing={0} divider={<Divider orientation="vertical" flexItem />}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="h6">Articles Read</Typography>
                <Typography variant="h4">{statistics.readArticles || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="h6">Reading Time</Typography>
                <Typography variant="h4">{getTotalReadingTime()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="h6">Current Streak</Typography>
                <Typography variant="h4">{readingStreak} days</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ height: '100%', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="h6">Top Category</Typography>
                <Typography variant="h4">
                  {topCategories.length > 0 ? topCategories[0].category : '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={3}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Categories" />
          <Tab label="Reading Times" />
          <Tab label="Daily Activity" />
        </Tabs>
        
        <Box sx={{ p: 3, height: 400 }}>
          {tabValue === 0 && (
            <Box sx={{ height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Articles Read by Category
              </Typography>
              {categoryData.labels.length > 0 ? (
                <Pie 
                  data={categoryData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      }
                    }
                  }} 
                />
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
                  No reading data available yet. Start reading some articles!
                </Typography>
              )}
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box sx={{ height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Reading Activity by Time of Day
              </Typography>
              {timeOfDayData.datasets[0].data.some(val => val > 0) ? (
                <Bar 
                  data={timeOfDayData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Articles Read'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Hour of Day'
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
                  No reading data available yet. Start reading some articles!
                </Typography>
              )}
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box sx={{ height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Daily Reading Activity (Last 14 Days)
              </Typography>
              {dailyReadingData.datasets[0].data.some(val => val > 0) ? (
                <Bar 
                  data={dailyReadingData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Articles Read'
                        }
                      },
                      y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                          drawOnChartArea: false
                        },
                        title: {
                          display: true,
                          text: 'Reading Time (min)'
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
                  No reading data available yet. Start reading some articles!
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReadingStatistics;