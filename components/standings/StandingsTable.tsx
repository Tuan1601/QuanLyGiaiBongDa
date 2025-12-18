import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface StandingsItem {
  position: number;
  team: {
    _id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
  form: ('W' | 'D' | 'L')[];
}

interface StandingsTableProps {
  standings: StandingsItem[];
}

export default function StandingsTable({ standings }: StandingsTableProps) {
  const router = useRouter();
  const colors = Colors;

  const getPositionBarColor = (position: number) => {
    if (position === 1) return '#4A90E2'; 
    return 'transparent';
  };

  const getFormIcon = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'checkmark';
      case 'D': return 'remove';
      case 'L': return 'close';
    }
  };

  const getFormColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return colors.win;
      case 'D': return colors.draw;
      case 'L': return colors.lose;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.tableWrapper}>
        <View style={styles.leftColumn}>
          <View style={[styles.leftHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerCell, { color: colors.textSecondary }]}>
              Cầu lạc bộ
            </Text>
          </View>
          
          {standings.map((item) => (
            <TouchableOpacity
              key={item.team._id}
              style={[styles.leftRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push(`/team/${item.team._id}`)}
            >
              <View style={[styles.positionBar, { backgroundColor: getPositionBarColor(item.position) }]} />
              
              <Text style={[styles.position, { color: colors.textSecondary }]}>
                {item.position}
              </Text>

              {item.team.logo ? (
                <Image source={{ uri: item.team.logo }} style={styles.teamLogo} />
              ) : (
                <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.teamLogoText}>{item.team.shortName}</Text>
                </View>
              )}
              
              <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                {item.team.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.rightColumn}
        >
          <View>
            <View style={[styles.rightHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>ĐĐ</Text>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>T</Text>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>H</Text>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>B</Text>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>BT</Text>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>SBT</Text>
              <Text style={[styles.statHeaderCell, { color: colors.textSecondary }]}>HS</Text>
              <Text style={[styles.ptsHeaderCell, { color: colors.textSecondary }]}>Đ</Text>
              <Text style={[styles.formHeaderCell, { color: colors.textSecondary }]}>5 trận gần nhất</Text>
            </View>
            
            {standings.map((item) => (
              <TouchableOpacity
                key={item.team._id}
                style={[styles.rightRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/team/${item.team._id}`)}
              >
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.played || 0}
                </Text>
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.won || 0}
                </Text>
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.drawn || 0}
                </Text>
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.lost || 0}
                </Text>
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.goalsFor || 0}
                </Text>
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.goalsAgainst || 0}
                </Text>
                <Text style={[styles.statCell, { color: colors.text }]}>
                  {item.stats?.goalDifference || 0}
                </Text>
                <Text style={[styles.ptsCell, styles.ptsValue, { color: colors.text }]}>
                  {item.stats?.points || 0}
                </Text>
                
                <View style={styles.formCell}>
                  {item.form && item.form.length > 0 ? (
                    item.form.slice(-5).map((result, index) => (
                      <View
                        key={index}
                        style={[styles.formCircle, { backgroundColor: getFormColor(result) }]}
                      >
                        <Ionicons name={getFormIcon(result)} size={10} color="#fff" />
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.noFormText, { color: colors.textSecondary }]}>-</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableWrapper: {
    flexDirection: 'row',
  },
  
  leftColumn: {
    width: 150,
  },
  leftHeader: {
    height: 44,
    paddingLeft: 8,
    borderBottomWidth: 2,
    justifyContent: 'center',
  },
  leftRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    borderBottomWidth: 1,
    gap: 6,
    position: 'relative',
  },
  positionBar: {
    width: 3,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  position: {
    fontSize: 13,
    fontWeight: '600',
    width: 18,
    textAlign: 'center',
  },
  teamLogo: {
    width: 26,
    height: 26,
    borderRadius: 5,
  },
  teamLogoPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  
  rightColumn: {
    flex: 1,
  },
  rightHeader: {
    height: 44,
    flexDirection: 'row',
    paddingRight: 12,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  rightRow: {
    height: 52,
    flexDirection: 'row',
    paddingRight: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  
  headerCell: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 34,
  },
  statHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: 32,
  },
  ptsHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: 36,
  },
  formHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    width: 110,
  },
  
  statCell: {
    fontSize: 13,
    textAlign: 'center',
    width: 32,
  },
  ptsCell: {
    fontSize: 13,
    textAlign: 'center',
    width: 36,
  },
  ptsValue: {
    fontWeight: 'bold',
  },
  formCell: {
    width: 110,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 3,
    paddingRight: 4,
  },
  formCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFormText: {
    fontSize: 12,
  },
});