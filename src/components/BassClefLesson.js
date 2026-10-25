
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {BackButton,COLORS,Page} from './native';

const NOTE_GUIDE=require('../../public/assets/Bass-Clef-Notes.webp');

const LESSONS=[
  {title:'Meet the Bass Clef',description:'The bass clef helps you identify lower notes on the staff. It is also called the F clef.',tip:'The two dots of the bass clef surround the F line.'},
  {title:'Learn the Lines',description:'Read the five bass-clef lines from bottom to top.',notes:['G','B','D','F','A'],tip:'Remember: Good Boys Do Fine Always.'},
  {title:'Learn the Spaces',description:'The spaces sit between the five lines.',notes:['A','C','E','G'],tip:'Remember: All Cows Eat Grass. Read the spaces from bottom to top.'},
  {title:'Find the Piano Keys',description:'Each bass-clef note matches a piano key. Learning the staff positions helps you find the correct key.',tip:'Open the note guide to connect the staff notes with the piano keys.'},
  {title:'Ready to Practice?',description:'You have learned the basics of the bass clef.',tip:'Now test what you know in the quiz.'},
];

function AnimatedStaffNotes({step,noteAnimations}){
  const isLineLesson=step===1;
  const notePositions=isLineLesson
    ?[
      {note:'G',top:101,left:'20%'},
      {note:'B',top:76,left:'35%'},
      {note:'D',top:51,left:'50%'},
      {note:'F',top:26,left:'65%'},
      {note:'A',top:1,left:'80%'},
    ]
    :[
      {note:'A',top:87.5,left:'20%'},
      {note:'C',top:62.5,left:'40%'},
      {note:'E',top:37.5,left:'60%'},
      {note:'G',top:12.5,left:'80%'},
    ];

  return(
    <View style={styles.staffDiagram}>
      <Text style={styles.staffClef}>𝄢</Text>
      <View style={styles.staffDiagramLines}>
        {[0,1,2,3,4].map(line=>(
          <View key={line} style={[styles.diagramLine,{top:10+line*25}]}/>
        ))}
        {notePositions.map((item,index)=>(
          <Animated.View
            key={`${step}-${item.note}`}
            style={[
              styles.animatedStaffNote,
              {
                top:item.top,
                left:item.left,
                opacity:noteAnimations[index],
                transform:[
                  {translateY:noteAnimations[index].interpolate({inputRange:[0,1],outputRange:[12,0]})},
                  {scale:noteAnimations[index].interpolate({inputRange:[0,1],outputRange:[0.25,1]})},
                ],
              },
            ]}
          >
            <View style={styles.noteHead}/>
            <View style={styles.noteStem}/>
            <Text style={styles.staffNoteLabel}>{item.note}</Text>
          </Animated.View>
        ))}
      </View>
      <Text style={styles.staffDiagramCaption}>
        {isLineLesson?'G  B  D  F  A  ·  LINES':'A  C  E  G  ·  SPACES'}
      </Text>
    </View>
  );
}

export default function BassClefLesson({onBack,onStartQuiz}){
  const [step,setStep]=useState(0);
  const [showGuide,setShowGuide]=useState(false);
  const entrance=useRef(new Animated.Value(0)).current;
  const headingEntrance=useRef(new Animated.Value(0)).current;
  const navigationEntrance=useRef(new Animated.Value(0)).current;
  const progress=useRef(new Animated.Value(0)).current;
  const noteAnimations=useRef(Array.from({length:5},()=>new Animated.Value(0))).current;
  const lesson=LESSONS[step];
  const isLastStep=step===LESSONS.length-1;

  useEffect(()=>{
    entrance.setValue(0);
    headingEntrance.setValue(0);
    navigationEntrance.setValue(0);
    progress.setValue(0);
    noteAnimations.forEach(animation=>animation.setValue(0));

    Animated.parallel([
      Animated.timing(headingEntrance,{toValue:1,duration:450,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
      Animated.timing(progress,{toValue:(step+1)/LESSONS.length,duration:650,easing:Easing.out(Easing.cubic),useNativeDriver:false}),
      Animated.sequence([Animated.delay(120),Animated.spring(entrance,{toValue:1,tension:55,friction:9,useNativeDriver:true})]),
      Animated.sequence([Animated.delay(260),Animated.timing(navigationEntrance,{toValue:1,duration:350,easing:Easing.out(Easing.cubic),useNativeDriver:true})]),
    ]).start();

    if(lesson.notes){
      Animated.stagger(220,lesson.notes.map((_,index)=>Animated.spring(noteAnimations[index],{toValue:1,speed:16,bounciness:7,useNativeDriver:true}))).start();
    }
  },[step]);

  const goToStep=nextStep=>{
    setShowGuide(false);
    setStep(nextStep);
  };

  const headingStyle={
    opacity:headingEntrance,
    transform:[{translateY:headingEntrance.interpolate({inputRange:[0,1],outputRange:[-12,0]})}],
  };

  const cardStyle={
    opacity:entrance,
    transform:[
      {translateY:entrance.interpolate({inputRange:[0,1],outputRange:[28,0]})},
      {scale:entrance.interpolate({inputRange:[0,1],outputRange:[0.96,1]})},
    ],
  };

  const navigationStyle={
    opacity:navigationEntrance,
    transform:[{translateY:navigationEntrance.interpolate({inputRange:[0,1],outputRange:[16,0]})}],
  };

  return(
    <Page>
      <BackButton onPress={onBack}/>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Animated.View style={[styles.headingArea,headingStyle]}>
          <Text style={styles.eyebrow}>PIANO LESSON</Text>
          <Text style={styles.heading}>Bass Clef</Text>
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill,{width:progress.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]}/>
        </View>

        <Text style={styles.stepText}>STEP {step+1} OF {LESSONS.length}</Text>

        <Animated.View style={[styles.card,cardStyle]}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>LESSON {String(step+1).padStart(2,'0')}</Text>
          </View>

          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.description}>{lesson.description}</Text>

          {lesson.notes&&(
            <View style={styles.notesBox}>
              <View style={styles.noteRow}>
                {lesson.notes.map((note,index)=>(
                  <Animated.View
                    key={`${step}-${note}`}
                    style={[
                      styles.noteChip,
                      {
                        opacity:noteAnimations[index],
                        transform:[
                          {translateY:noteAnimations[index].interpolate({inputRange:[0,1],outputRange:[18,0]})},
                          {scale:noteAnimations[index].interpolate({inputRange:[0,1],outputRange:[0.7,1]})},
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.notes}>{note}</Text>
                  </Animated.View>
                ))}
              </View>
              <Text style={styles.smallText}>{step===1?'Five lines · bottom to top':'Four spaces · bottom to top'}</Text>
              <AnimatedStaffNotes step={step} noteAnimations={noteAnimations}/>
            </View>
          )}

          {step===0&&(
            <View style={styles.clefVisual}>
              <Text style={styles.clefSymbol}>𝄢</Text>
              <View style={styles.staff}>
                {[0,1,2,3,4].map(line=><View key={line} style={styles.staffLine}/>)}
              </View>
              <Text style={styles.staffCaption}>FIVE LINES · FOUR SPACES</Text>
            </View>
          )}

          {step===3&&(
            <View style={styles.keyboardPreview}>
              {['C','D','E','F','G','A','B'].map(note=>(
                <View key={note} style={styles.keyColumn}>
                  <View style={[styles.whiteKey,note==='G'&&styles.highlightedKey]}/>
                  <Text style={[styles.keyLabel,note==='G'&&styles.highlightedKeyLabel]}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>✦ REMEMBER</Text>
            <Text style={styles.tipText}>{lesson.tip}</Text>
          </View>

          <Pressable
            style={({pressed})=>[styles.guideButton,pressed&&styles.pressed]}
            onPress={()=>setShowGuide(!showGuide)}
            accessibilityRole="button"
            accessibilityLabel={showGuide?'Hide note reference guide':'Show note reference guide'}
          >
            <Text style={styles.guideButtonText}>{showGuide?'Hide Note Guide':'View Note Guide'}</Text>
            <Text style={styles.arrow}>{showGuide?'⌃':'⌄'}</Text>
          </Pressable>

          {showGuide&&(
            <Animated.View style={{opacity:entrance,transform:[{translateY:entrance.interpolate({inputRange:[0,1],outputRange:[10,0]})}]}}>
              <Image
                source={NOTE_GUIDE}
                style={styles.guideImage}
                resizeMode="contain"
                accessibilityLabel="Bass clef lines, spaces, and piano key reference"
              />
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View style={[styles.navigation,navigationStyle]}>
          {step>0&&(
            <Pressable style={({pressed})=>[styles.backButton,pressed&&styles.pressed]} onPress={()=>goToStep(step-1)}>
              <Text style={styles.backButtonText}>Previous</Text>
            </Pressable>
          )}
          <Pressable
            style={({pressed})=>[styles.continueButton,pressed&&styles.continuePressed]}
            onPress={()=>isLastStep?onStartQuiz?.():goToStep(step+1)}
          >
            <Text style={styles.continueText}>{isLastStep?'Back to Activities':'Continue'}</Text>
            <Text style={styles.continueArrow}>{isLastStep?'♫':'→'}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Page>
  );
}

const styles=StyleSheet.create({
  container:{paddingBottom:24,gap:14},
  headingArea:{alignItems:'center',gap:5},
  eyebrow:{color:COLORS.primary,fontSize:12,fontWeight:'800',letterSpacing:2,textAlign:'center'},
  heading:{color:COLORS.text,fontSize:28,fontWeight:'800',textAlign:'center'},
  progressTrack:{height:7,backgroundColor:'#343D59',borderRadius:10,overflow:'hidden'},
  progressFill:{height:'100%',backgroundColor:COLORS.primary,borderRadius:10},
  stepText:{color:COLORS.text,opacity:0.7,textAlign:'center',fontSize:11,fontWeight:'800',letterSpacing:1.5},
  card:{backgroundColor:'#202943',borderRadius:18,padding:18,gap:16,borderWidth:1,borderColor:'rgba(255,255,255,0.06)'},
  stepIndicator:{alignSelf:'center',backgroundColor:'#151D34',borderRadius:20,paddingHorizontal:12,paddingVertical:6},
  stepIndicatorText:{color:COLORS.primary,fontSize:10,fontWeight:'900',letterSpacing:1},
  lessonTitle:{color:COLORS.text,fontSize:22,fontWeight:'800',textAlign:'center'},
  description:{color:COLORS.text,fontSize:15,lineHeight:23,textAlign:'center'},
  notesBox:{alignItems:'center',backgroundColor:'#151D34',borderRadius:14,padding:18,gap:12},
  noteRow:{flexDirection:'row',justifyContent:'center',gap:8,flexWrap:'wrap'},
  noteChip:{width:43,height:48,borderRadius:10,backgroundColor:'#293753',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:COLORS.primary},
  notes:{color:COLORS.primary,fontSize:25,fontWeight:'900'},
  smallText:{color:COLORS.text,opacity:0.7,fontSize:12,textAlign:'center'},
  staffDiagram:{width:'100%',height:190,alignItems:'center',justifyContent:'flex-start',marginTop:4},
  staffClef:{position:'absolute',left:5,top:28,color:'#D8DCE8',fontSize:58,lineHeight:75,zIndex:2},
  staffDiagramLines:{position:'absolute',top:15,left:0,right:0,height:125},
  diagramLine:{position:'absolute',left:0,right:0,height:2,backgroundColor:'#D8DCE8'},
  animatedStaffNote:{position:'absolute',left:'43%',width:100,height:20,flexDirection:'row',alignItems:'center'},
  noteHead:{width:19,height:12,borderRadius:15,backgroundColor:COLORS.primary,borderWidth:1,borderColor:'#FFFFFF',transform:[{rotate:'-10deg'}],zIndex:2},
  noteStem:{position:'absolute',left:16,top:-15,width:2,height:24,backgroundColor:COLORS.primary},
  staffNoteLabel:{position:'absolute',left:29,color:'#FFFFFF',fontSize:16,fontWeight:'900'},
  staffDiagramCaption:{position:'absolute',bottom:3,color:COLORS.primary,fontSize:11,fontWeight:'900',letterSpacing:1},
  clefVisual:{backgroundColor:'#151D34',borderRadius:14,padding:14,alignItems:'center',gap:10},
  clefSymbol:{color:COLORS.primary,fontSize:68,lineHeight:75},
  staff:{width:'100%',gap:10,paddingVertical:8},
  staffLine:{height:2,width:'100%',backgroundColor:'#D8DCE8'},
  staffCaption:{color:COLORS.text,opacity:0.7,fontSize:10,fontWeight:'800',letterSpacing:1},
  keyboardPreview:{flexDirection:'row',justifyContent:'center',gap:3,backgroundColor:'#151D34',padding:12,borderRadius:12},
  keyColumn:{flex:1,alignItems:'center',gap:5},
  whiteKey:{height:65,width:'100%',maxWidth:38,backgroundColor:'#F5F5F5',borderRadius:4,borderWidth:1,borderColor:'#AEB5C5'},
  highlightedKey:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
  keyLabel:{color:COLORS.text,fontSize:12,fontWeight:'800'},
  highlightedKeyLabel:{color:COLORS.primary},
  tipBox:{backgroundColor:'#293753',borderRadius:12,padding:14,gap:6},
  tipTitle:{color:COLORS.primary,fontSize:12,fontWeight:'800',letterSpacing:1},
  tipText:{color:COLORS.text,fontSize:14,lineHeight:21},
  guideButton:{minHeight:48,borderRadius:12,borderWidth:1,borderColor:COLORS.primary,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  guideButtonText:{color:COLORS.text,fontWeight:'700',fontSize:14},
  arrow:{color:COLORS.primary,fontSize:25,fontWeight:'800'},
  guideImage:{width:'100%',height:250,backgroundColor:'#FFFFFF',borderRadius:10},
  navigation:{flexDirection:'row',gap:10},
  backButton:{flex:1,minHeight:50,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#343D59'},
  backButtonText:{color:COLORS.text,fontSize:15,fontWeight:'700'},
  continueButton:{flex:2,minHeight:50,borderRadius:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:10,backgroundColor:COLORS.primary},
  continueText:{color:'#10182C',fontSize:16,fontWeight:'800'},
  continueArrow:{color:'#10182C',fontSize:20,fontWeight:'900'},
  pressed:{opacity:0.75},
  continuePressed:{opacity:0.85,transform:[{scale:0.98}]},
});
