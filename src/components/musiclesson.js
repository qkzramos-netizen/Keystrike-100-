
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,Modal,Pressable,Text,View,Alert} from 'react-native';
import {useAudioPlayer} from 'expo-audio';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {recordGameResult,recordGuestGameResult} from '../achievements';
import {auth} from '../firebase';
import AccountSavePrompt from './AccountSavePrompt';
import {AppButton,BackButton,COLORS,Page,styles} from './native';
import PianoLessonMenu from './PianoLessonMenu';
import TrebleClefLesson from './TrebleClefLesson';
import TrebleClefPractice from './TrebleClefPractice';
import BassClefPractice from './BassClefPractice';
import ClefActivityMenu from './ClefActivityMenu';
import BassClefLesson from './BassClefLesson';
import PianoLessonList from './PianoLessonList';

const TREBLE_QUESTIONS=[
  {note:'B4',answer:'B',options:['C','D','B']},
  {note:'C4',answer:'C',options:['C','E','G']},
  {note:'D4',answer:'D',options:['D','F','A']},
  {note:'E4',answer:'E',options:['C','E','B']},
  {note:'F4',answer:'F',options:['F','G','D']},
  {note:'G4',answer:'G',options:['E','G','A']},
  {note:'A4',answer:'A',options:['F','A','C']},
  {note:'B4',answer:'B',options:['B','D','G']},
  {note:'C5',answer:'C',options:['A','C','E']},
  {note:'D5',answer:'D',options:['B','D','F']},
];
const BASS_QUESTIONS=[
  {note:'E2',answer:'E',options:['E','F','G']},
  {note:'F2',answer:'F',options:['F','G','A']},
  {note:'G2',answer:'G',options:['G','A','B']},
  {note:'A2',answer:'A',options:['A','B','C']},
  {note:'B2',answer:'B',options:['B','C','D']},
  {note:'C3',answer:'C',options:['C','D','E']},
  {note:'D3',answer:'D',options:['D','E','F']},
  {note:'E3',answer:'E',options:['E','F','G']},
  {note:'F3',answer:'F',options:['F','G','A']},
  {note:'G3',answer:'G',options:['G','A','B']},
  {note:'A3',answer:'A',options:['A','B','C']},
];
const CHORD_QUESTIONS=[
  {note:'C Major',answer:'C',options:['C','G','A']},
  {note:'G Major',answer:'G',options:['D','G','F']},
  {note:'A Minor',answer:'A',options:['A','C','E']},
];
const NOTE_IMAGES={
  C4:require('../../public/note/C4.png'),
  D4:require('../../public/note/D4.png'),
  E4:require('../../public/note/E4.png'),
  F4:require('../../public/note/F4.png'),
  G4:require('../../public/note/G4.png'),
  A4:require('../../public/note/A1.png'),
  B4:require('../../public/note/B.png'),
  C5:require('../../public/note/C5.png'),
  D5:require('../../public/note/D5.png'),
  E2:require('../../public/note/E.png'),
  F2:require('../../public/note/F.png'),
  G2:require('../../public/note/G.png'),
  A2:require('../../public/note/A.png'),
  B2:require('../../public/note/B..png'),
  C3:require('../../public/note/C.png'),
  D3:require('../../public/note/D.png'),
  E3:require('../../public/note/E2.png'),
  F3:require('../../public/note/F2.png'),
  G3:require('../../public/note/G2.png'),
  A3:require('../../public/note/A2.png'),
  'C Major':require('../../public/note/CMajor.png'),
  'G Major':require('../../public/note/GMajor.png'),
  'A Minor':require('../../public/note/AMinor.png'),
};
const LESSON_MUSIC={
  Treble:require('../../public/assets/music/clair.mp3'),
  Bass:require('../../public/assets/music/chopin.mp3'),
  Chords:require('../../public/assets/music/gym.mp3'),
};
const BUTTON_SFX=require('../../public/appsfx/mainsfx.mp3');

function shuffleQuestions(questions){
  return [...questions].sort(()=>Math.random()-0.5);
}

function RhythmButton({children,onPress,disabled,style,accessibilityLabel}){
  const scale=useRef(new Animated.Value(1)).current;
  const pressIn=()=>Animated.spring(scale,{toValue:0.93,speed:35,bounciness:2,useNativeDriver:true}).start();
  const pressOut=()=>Animated.spring(scale,{toValue:1,speed:22,bounciness:9,useNativeDriver:true}).start();
  return <Animated.View style={[style,{transform:[{scale}]}]}><Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} disabled={disabled} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} style={{flex:1,alignItems:'center',justifyContent:'center'}}>{children}</Pressable></Animated.View>;
}

function StaffCard({note,mode}){
  const image=NOTE_IMAGES[note];
  return <View style={{width:'100%',aspectRatio:16/9,backgroundColor:'#d8d8d8',borderRadius:8,overflow:'hidden',alignItems:'center',justifyContent:'center'}}>{image?<Image source={image} resizeMode="contain" style={{width:'100%',height:'100%',alignSelf:'center'}}/>:<Text style={{color:'#555555',fontSize:16}}>{mode==='Chords'?`${note} chord image coming soon`:`${note} image coming soon`}</Text>}</View>;
}

function MusicLesson({onNavigate,audioSettings,onAudioSettingsChange,playButtonSound:playGlobalButtonSound}){
  const safeAreaInsets=useSafeAreaInsets();
  const [index,setIndex]=useState(0);
  const [shuffledQuestions,setShuffledQuestions]=useState(()=>shuffleQuestions(TREBLE_QUESTIONS));
  const [score,setScore]=useState(0);
  const [correctCount,setCorrectCount]=useState(0);
  const [incorrectCount,setIncorrectCount]=useState(0);
  const [selected,setSelected]=useState(null);
  const [complete,setComplete]=useState(false);
  const [savePromptResult,setSavePromptResult]=useState(null);
  const [error,setError]=useState('');
  const [mode,setMode]=useState('Treble');
  const [lessonStarted,setLessonStarted]=useState(false);
  const [streak,setStreak]=useState(0);
  const [bestStreak,setBestStreak]=useState(0);
  const [showActivityMenu,setShowActivityMenu]=useState(false);
  const [showBassPractice,setShowBassPractice]=useState(false);
  const [showTrebleLesson,setShowTrebleLesson]=useState(false);
  const [showTreblePractice,setShowTreblePractice]=useState(false);
  const [showBassLesson,setShowBassLesson]=useState(false);
  const [showLessonList,setShowLessonList]=useState(false);

  const resultSaved=useRef(false);
  const fadeTimer=useRef(null);
  const cardScale=useRef(new Animated.Value(0.96)).current;
  const cardOpacity=useRef(new Animated.Value(0)).current;
  const progressAnim=useRef(new Animated.Value(0)).current;
  const audioPlayer=useAudioPlayer(LESSON_MUSIC.Treble);
  const buttonSoundPlayer=useAudioPlayer(BUTTON_SFX);
  const currentMusicMode=useRef(null);

  // Local screen transition animation
  const localTransitionOpacity=useRef(new Animated.Value(0)).current;
  const localTransitionScale=useRef(new Animated.Value(1)).current;
  const localTransitioning=useRef(false);

  const runLocalTransition=useCallback((action)=>{
    if(localTransitioning.current)return;
    localTransitioning.current=true;

    Animated.parallel([
      Animated.timing(localTransitionOpacity,{
        toValue:0.85,duration:130,
        easing:Easing.in(Easing.quad),useNativeDriver:true,
      }),
      Animated.timing(localTransitionScale,{
        toValue:0.965,duration:130,
        easing:Easing.in(Easing.quad),useNativeDriver:true,
      }),
    ]).start(({finished})=>{
      if(!finished){
        localTransitioning.current=false;
        return;
      }

      action();
      localTransitionScale.setValue(1.025);

      Animated.parallel([
        Animated.timing(localTransitionOpacity,{
          toValue:0,duration:260,
          easing:Easing.out(Easing.quad),useNativeDriver:true,
        }),
        Animated.timing(localTransitionScale,{
          toValue:1,duration:260,
          easing:Easing.out(Easing.cubic),useNativeDriver:true,
        }),
      ]).start(()=>{localTransitioning.current=false;});
    });
  },[localTransitionOpacity,localTransitionScale]);

  const renderLocalTransition=(content)=>(
    <View style={{flex:1,width:'100%',overflow:'hidden'}}>
      <Animated.View style={{flex:1,transform:[{scale:localTransitionScale}]}}>
        {content}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{
          position:'absolute',top:0,right:0,bottom:0,left:0,
          backgroundColor:'#080b25',opacity:localTransitionOpacity,
        }}
      />
    </View>
  );

  const QUESTIONS={Treble:shuffledQuestions,Bass:BASS_QUESTIONS,Chords:CHORD_QUESTIONS}[mode];
  const question=QUESTIONS[index];
  const musicActive=!complete;
  const musicEnabled=audioSettings?.music!==false;
  const musicAudible=musicEnabled&&(audioSettings?.musicVolume??100)>0;

  const playButtonSound=useCallback(()=>{
    if(playGlobalButtonSound){playGlobalButtonSound();return;}
    if(!audioSettings?.soundEffects||(audioSettings?.soundEffectsVolume??100)<=0)return;
    try{
      buttonSoundPlayer.volume=(audioSettings?.soundEffectsVolume??100)/100;
      buttonSoundPlayer.seekTo(0);
      buttonSoundPlayer.play();
    }catch(e){console.warn('Button sound failed:',e);}
  },[playGlobalButtonSound,buttonSoundPlayer,audioSettings]);

  const startLessonMusic=useCallback((selectedMode=mode)=>{
    if(!musicAudible){
      if(fadeTimer.current)clearInterval(fadeTimer.current);
      fadeTimer.current=null;
      audioPlayer.pause();
      return;
    }
    const LESSON_MUSIC_MULTIPLIER=8;
    const targetVolume=Math.min(1,((audioSettings?.musicVolume??100)/100)*LESSON_MUSIC_MULTIPLIER);
    if(currentMusicMode.current===selectedMode){
      try{audioPlayer.volume=targetVolume;audioPlayer.play();}
      catch(e){console.warn('Music playback failed:',e);}
      return;
    }
    if(fadeTimer.current)clearInterval(fadeTimer.current);
    fadeTimer.current=null;
    currentMusicMode.current=selectedMode;
    try{
      audioPlayer.pause();
      audioPlayer.volume=0;
      audioPlayer.replace(LESSON_MUSIC[selectedMode]);
      audioPlayer.loop=true;
      audioPlayer.play();
      let step=0;
      fadeTimer.current=setInterval(()=>{
        step++;
        try{audioPlayer.volume=Math.min(step/50*targetVolume,targetVolume);}
        catch(e){console.warn('Music fade failed:',e);}
        if(step>=50){clearInterval(fadeTimer.current);fadeTimer.current=null;}
      },50);
    }catch(e){console.warn('Music playback failed:',e);}
  },[audioPlayer,mode,musicAudible,audioSettings?.musicVolume]);

  useEffect(()=>{
    if(musicActive&&musicAudible)startLessonMusic(mode);
    else{
      if(fadeTimer.current)clearInterval(fadeTimer.current);
      fadeTimer.current=null;
      audioPlayer.pause();
      if(!musicActive){audioPlayer.seekTo(0);currentMusicMode.current=null;}
    }
  },[musicActive,mode,musicAudible,startLessonMusic,audioPlayer]);

  
useEffect(() => {
  return () => {
    if (fadeTimer.current) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  };
}, [audioPlayer]);


  useEffect(()=>{
    if(!lessonStarted||complete)return;
    cardScale.setValue(0.96);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cardScale,{toValue:1,duration:240,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
      Animated.timing(cardOpacity,{toValue:1,duration:240,useNativeDriver:true}),
    ]).start();
  },[index,mode,lessonStarted,complete,cardScale,cardOpacity]);

  useEffect(()=>{
    if(!lessonStarted)return;
    Animated.timing(progressAnim,{
      toValue:complete?1:index/QUESTIONS.length,
      duration:300,easing:Easing.out(Easing.cubic),useNativeDriver:false,
    }).start();
  },[index,complete,lessonStarted,QUESTIONS.length,progressAnim]);

  const resetQuiz=(newMode)=>{
    const questionSet={Treble:TREBLE_QUESTIONS,Bass:BASS_QUESTIONS,Chords:CHORD_QUESTIONS}[newMode];
    setMode(newMode);
    setShuffledQuestions(newMode==='Treble'?shuffleQuestions(TREBLE_QUESTIONS):questionSet);
    setIndex(0);setScore(0);setCorrectCount(0);setIncorrectCount(0);
    setSelected(null);setComplete(false);setSavePromptResult(null);setError('');
    setStreak(0);setBestStreak(0);resultSaved.current=false;progressAnim.setValue(0);
  };

  const selectLesson=(newMode)=>{
    runLocalTransition(()=>{
      playButtonSound();
      resetQuiz(newMode);
      setLessonStarted(false);
      setShowTrebleLesson(false);setShowTreblePractice(false);
      setShowBassLesson(false);setShowBassPractice(false);
      setShowActivityMenu(true);setShowLessonList(false);
      startLessonMusic(newMode);
    });
  };

  const backToActivities=()=>{
    runLocalTransition(()=>{
      playButtonSound();
      setLessonStarted(false);setComplete(false);setSelected(null);
      setShowTrebleLesson(false);setShowTreblePractice(false);
      setShowBassLesson(false);setShowBassPractice(false);
      setShowActivityMenu(true);setShowLessonList(false);
    });
  };

  const startQuiz=()=>{
    runLocalTransition(()=>{
      playButtonSound();
      resetQuiz(mode);
      setShowActivityMenu(false);
      setShowTrebleLesson(false);setShowTreblePractice(false);
      setShowBassLesson(false);setShowBassPractice(false);
      setLessonStarted(true);
      startLessonMusic(mode);
    });
  };

  useEffect(()=>{
    if(selected===null||!lessonStarted)return undefined;
    const timer=setTimeout(()=>{
      if(index+1<QUESTIONS.length){
        setIndex(current=>current+1);
        setSelected(null);
      }else setComplete(true);
    },700);
    return()=>clearTimeout(timer);
  },[selected,index,QUESTIONS.length,lessonStarted]);

  useEffect(()=>{
    if(!complete||!lessonStarted||resultSaved.current)return;
    resultSaved.current=true;
    const result={
      score,notesPressed:correctCount+incorrectCount,
      perfect:score===QUESTIONS.length*100,
    };
    const saveResult=async()=>{
      try{
        if(auth.currentUser)await recordGameResult('pianoLesson',result);
        else{
          const guestResultId=await recordGuestGameResult('pianoLesson',result);
          setSavePromptResult({...result,guestResultId});
        }
      }catch(e){setError(e.message||'Could not save this lesson result.');}
    };
    saveResult();
  },[complete,lessonStarted,score,correctCount,incorrectCount,QUESTIONS.length]);

  const answerQuestion=(option)=>{
    if(selected!==null||!question)return;
    playButtonSound();setSelected(option);
    if(option===question.answer){
      setScore(current=>current+100);
      setCorrectCount(current=>current+1);
      setStreak(current=>{
        const next=current+1;
        setBestStreak(best=>Math.max(best,next));
        return next;
      });
    }else{
      setIncorrectCount(current=>current+1);
      setStreak(0);
    }
  };

  const restart=()=>{
    playButtonSound();
    resetQuiz(mode);
    setLessonStarted(true);
    startLessonMusic(mode);
  };

  const toggleMusic=()=>{
    if(!onAudioSettingsChange)return;
    onAudioSettingsChange({music:!musicEnabled});
  };

  const renderMusicToggle=(outsideSafeArea=false)=>(
    <Pressable accessibilityRole="button" accessibilityLabel={musicEnabled?'Mute music':'Unmute music'} onPress={toggleMusic} style={{position:'absolute',top:16+(outsideSafeArea?safeAreaInsets.top:0),right:16,zIndex:1000,paddingHorizontal:14,paddingVertical:9,borderRadius:20,backgroundColor:'#201D12',borderWidth:1,borderColor:'#D4AF37'}}>
      <Text style={{color:'#e2e2e1',fontSize:13,fontWeight:'800'}}>{musicEnabled?'♫ Music ON':'♫ Music OFF'}</Text>
    </Pressable>
  );

  const renderActivity=()=>(
    <ClefActivityMenu
      mode={mode}
      onBack={()=>runLocalTransition(()=>{
        playButtonSound();
        setShowActivityMenu(false);
        setLessonStarted(false);
      })}
      onLesson={()=>{
        if(mode!=='Treble'&&mode!=='Bass'){
          Alert.alert('Lesson not available yet',`${mode} Lesson has not been added yet.`);
          return;
        }
        runLocalTransition(()=>{
          playButtonSound();
          startLessonMusic(mode);
          setShowActivityMenu(false);
          setShowLessonList(true);
        });
      }}
      onPractice={()=>{
        if(mode!=='Treble'&&mode!=='Bass'){
          Alert.alert('Practice not available yet',`${mode} Practice has not been added yet.`);
          return;
        }
        runLocalTransition(()=>{
          playButtonSound();
          startLessonMusic(mode);
          setShowActivityMenu(false);
          if(mode==='Treble')setShowTreblePractice(true);
          else setShowBassPractice(true);
        });
      }}
      onQuiz={startQuiz}
    />
  );

  const renderLessonList=()=>(
    <View style={{flex:1,width:'100%'}}>
      {renderMusicToggle(true)}
      <PianoLessonList
        clef={mode}
        onBack={()=>runLocalTransition(()=>{
          playButtonSound();
          setShowLessonList(false);
          setShowActivityMenu(true);
        })}
        onSelectLesson={()=>runLocalTransition(()=>{
          playButtonSound();
          setShowLessonList(false);
          if(mode==='Treble')setShowTrebleLesson(true);
          else if(mode==='Bass')setShowBassLesson(true);
        })}
      />
    </View>
  );

  if(showLessonList)return renderLocalTransition(renderLessonList());

  if(showTrebleLesson)return renderLocalTransition(
    <TrebleClefLesson onBack={backToActivities} onStartQuiz={backToActivities}/>
  );

  if(showTreblePractice)return renderLocalTransition(
    <TrebleClefPractice onBack={backToActivities} onComplete={backToActivities}/>
  );

  if(showBassLesson)return renderLocalTransition(
    <BassClefLesson onBack={backToActivities} onStartQuiz={backToActivities}/>
  );

  if(showBassPractice)return renderLocalTransition(
    <BassClefPractice onBack={backToActivities} onComplete={backToActivities}/>
  );

  if(showActivityMenu)return renderLocalTransition(
    <View style={{flex:1,width:'100%'}}>
      {renderMusicToggle(true)}
      {renderActivity()}
    </View>
  );

  if(!lessonStarted){
    return renderLocalTransition(
      <View style={{flex:1,width:'100%',alignSelf:'stretch',backgroundColor:'#01013a'}}>
        {renderMusicToggle(true)}
        <Image source={require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif')} resizeMode="cover" style={{position:'absolute',top:0,right:0,bottom:0,left:0,width:'100%',height:'100%'}}/>
        <View pointerEvents="none" style={{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(1, 1, 58, 0.8)'}}/>
        <BackButton style={{top:10+safeAreaInsets.top}} onPress={()=>{playButtonSound();onNavigate('playmenu');}}/>
        <View style={{flex:1,width:'100%',alignSelf:'stretch'}}>
          <PianoLessonMenu onSelectLesson={selectLesson}/>
        </View>
      </View>
    );
  }

  return renderLocalTransition(
    <Page style={{backgroundColor:'#121212',justifyContent:'center',paddingHorizontal:12,paddingTop:64}} contentStyle={{maxWidth:380}}>
      {renderMusicToggle()}
      <BackButton label="‹  Back to Activities" onPress={backToActivities}/>
      <View style={{width:'100%',minHeight:650,padding:20,borderRadius:30,backgroundColor:'#000000',borderWidth:1,borderColor:'#333333'}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:4,paddingBottom:12,borderBottomWidth:2,borderBottomColor:'#333333'}}>
          <Text style={{color:'#8e8e93',fontSize:13,fontWeight:'600'}}>Question {index+1}/{QUESTIONS.length}</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <Text style={{color:'#d4af37',fontSize:13,fontWeight:'700',letterSpacing:0.5}}>SCORE: {score}</Text>
          </View>
        </View>

        <View style={{marginTop:16,marginBottom:12}}>
          <View style={{height:7,backgroundColor:'#303030',borderRadius:10,overflow:'hidden'}}>
            <Animated.View style={{height:'100%',width:progressAnim.interpolate({inputRange:[0,1],outputRange:['0%','100%']}),backgroundColor:'#D4AF37',borderRadius:10}}/>
          </View>
          <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10}}>
            <Text style={{color:'#999999',fontSize:12}}>PROGRESS</Text>
            <Text style={{color:'#D4AF37',fontSize:12,fontWeight:'700'}}>{Math.round((complete?1:index/QUESTIONS.length)*100)}%</Text>
          </View>
        </View>

        <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',marginBottom:8,paddingVertical:8,borderRadius:10,backgroundColor:'#201D12',borderWidth:1,borderColor:'#51431C'}}>
          <Text style={{color:'#D4AF37',fontSize:14,fontWeight:'800'}}>{'🔥  STREAK  '}{streak}</Text>
          <Text style={{color:'#8E8E93',fontSize:12,marginLeft:18}}>BEST: {bestStreak}</Text>
        </View>

        <Text style={{color:'#cccccc',fontSize:14,textAlign:'center',marginTop:22,marginBottom:12}}>What note is this?</Text>
        <View style={{flex:1,justifyContent:'center'}}>
          <Animated.View style={{opacity:cardOpacity,transform:[{scale:cardScale}]}}>
            {question&&<StaffCard note={question.note} mode={mode}/>}
          </Animated.View>
        </View>

        <View style={{width:'100%',flexDirection:'row',marginTop:20,marginBottom:16}}>
          {question?.options.map(option=>{
            const chosen=selected===option;
            const correct=chosen&&option===question.answer;
            return <RhythmButton key={option} disabled={selected!==null} onPress={()=>answerQuestion(option)} style={{flex:1,minHeight:52,marginHorizontal:5,borderRadius:8,backgroundColor:chosen?(correct?'#8b8000':'#8b0000'):'#2a2a2a',borderWidth:1,borderColor:chosen?(correct?'#d4af37':'#ff4d4d'):'#444444',opacity:selected!==null&&!chosen?0.55:1}}><Text style={{color:'#ffffff',fontSize:20,fontWeight:'800'}}>{option}</Text></RhythmButton>;
          })}
        </View>

        <Text style={{color:'#d4af37',fontSize:12,fontWeight:'700',letterSpacing:1,textAlign:'center',marginBottom:8}}>TAP THE CORRECT NOTE</Text>
        {error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}
      </View>

      <Modal animationType="fade" onRequestClose={()=>{}} transparent visible={complete&&!savePromptResult}>
        <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(0,0,0,0.75)'}}>
          <View style={[styles.card,{padding:26,backgroundColor:'#1e1e1e',borderColor:'#d4af37',borderRadius:16}]}>
            <Text style={{color:'#d4af37',fontSize:24,fontWeight:'800',textAlign:'center'}}>LESSON COMPLETE!</Text>
            <Text style={{color:COLORS.muted,marginTop:18}}>Points earned: {score} / {QUESTIONS.length*100}</Text>
            <Text style={{color:COLORS.muted,marginTop:8}}>Correct answers: {correctCount}</Text>
            <Text style={{color:COLORS.muted,marginTop:8}}>Incorrect answers: {incorrectCount}</Text>
            <AppButton title="Try again" onPress={restart}/>
            <AppButton title="Back to Activities" onPress={backToActivities}/>
          </View>
        </View>
      </Modal>

      {savePromptResult&&<AccountSavePrompt mode="pianoLesson" result={savePromptResult} onNavigate={onNavigate} onDismiss={()=>setSavePromptResult(null)}/>}
    </Page>
  );
}

export default MusicLesson;
