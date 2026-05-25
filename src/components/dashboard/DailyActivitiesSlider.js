import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 160;
const SWIPE_THRESHOLD = 50;

const activities = [
  {
    id: '1',
    title: 'New Sales Order',
    time: '10:30 AM',
    status: 'Pending',
    icon: 'cart-outline',
    color: '#3B82F6',
  },
  {
    id: '2',
    title: 'Inventory Update',
    time: '11:45 AM',
    status: 'Success',
    icon: 'cube-outline',
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Meeting with Client',
    time: '02:00 PM',
    status: 'Upcoming',
    icon: 'people-outline',
    color: '#F59E0B',
  },
  {
    id: '4',
    title: 'System Backup',
    time: '05:00 PM',
    status: 'Scheduled',
    icon: 'cloud-upload-outline',
    color: '#8B5CF6',
  },
];

const ActivityCard = ({ activity, index, currentIndex, theme }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isVisible =
      index >= currentIndex.value && index < currentIndex.value + 3;
    const position = index - currentIndex.value;

    return {
      zIndex: activities.length - index,
      opacity: withSpring(isVisible ? 1 : 0),
      transform: [
        {
          translateY: withSpring(position * 15),
        },
        {
          scale: withSpring(1 - position * 0.05),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.shadows.md.shadowColor,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: activity.color + '20' },
        ]}
      >
        <Icon name={activity.icon} size={24} color={activity.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {activity.title}
        </Text>
        <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
          {activity.time}
        </Text>
      </View>
      <View
        style={[styles.statusBadge, { backgroundColor: activity.color + '10' }]}
      >
        <Text style={[styles.statusText, { color: activity.color }]}>
          {activity.status}
        </Text>
      </View>
    </Animated.View>
  );
};

const DailyActivitiesSlider = () => {
  const { theme } = useTheme();
  const currentIndex = useSharedValue(0);

  const panGesture = Gesture.Pan().onFinalize(e => {
    if (
      e.translationY < -SWIPE_THRESHOLD &&
      currentIndex.value < activities.length - 1
    ) {
      currentIndex.value = withSpring(currentIndex.value + 1);
    } else if (e.translationY > SWIPE_THRESHOLD && currentIndex.value > 0) {
      currentIndex.value = withSpring(currentIndex.value - 1);
    }
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.text }]}>
        Daily Activities
      </Text>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.stackContainer}>
          {activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={index}
              currentIndex={currentIndex}
              theme={theme}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    height: 250,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  stackContainer: {
    height: CARD_HEIGHT + 40,
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default DailyActivitiesSlider;
