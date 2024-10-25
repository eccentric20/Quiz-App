import express from "express"
import ejs from "ejs"
import bodyParser from "body-parser"
import axios from "axios";
import session from "express-session";
import path, {dirname} from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));



const app = express();
const port = 3000;
const apiUrl = 'https://opentdb.com/api.php?amount=10&category=17&type=multiple';

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

app.use(express.static(__dirname));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.get('/', async(req, res) => {
    
    res.sendFile(path.join(__dirname, 'index.html'));
    
});

app.get('/start', async(req,res) =>{
    try{
        const response = await axios.get(apiUrl);
        const quizData = response.data.results;

        req.session.quizData = quizData;
        req.session.currentQuestion = 0;
        req.session.score = 0;

        res.redirect('/quiz/1');
    } catch(error){
        console.error('Error fetching quiz data:', error);
        res.status(500).send('Failed to start the quiz');
    }
});



app.get('/quiz/:questionNumber', async(req,res) => {
    const questionNumber = parseInt(req.params.questionNumber, 10)-1;
    
    if(questionNumber<10){
        const quizData = req.session.quizData;
        const currentQuestion = quizData[questionNumber];
        const incorrAns = currentQuestion.incorrect_answers;
        const corrAns = currentQuestion.correct_answer;
        const completed = false;
        const allAnswers = [incorrAns[0],incorrAns[1],incorrAns[2],corrAns].sort(() => Math.random() - 0.5);
        


        res.render('quiz.ejs', {
            questionNumber: questionNumber+1,
            ques: currentQuestion.question,
            answers: allAnswers,
            totalQuestions: quizData,
            completed
        });
    }
    else{
        
        res.redirect('/finish');
    }
    
    
    
});

app.post('/quiz/:questionNumber/answer', (req, res) => {
    const questionNumber = parseInt(req.params.questionNumber, 10)-1;
    const quizData = req.session.quizData;
    const correctAnswer = quizData[questionNumber].correct_answer;

    if(req.body.answer === correctAnswer){
        req.session.score += 10;
    }

    res.redirect(`/quiz/${questionNumber+2}`);
})

app.get('/finish', async(req, res) => {
    const score = req.session.score;
    const totalQuestions = req.session.quizData.length;
    res.render('finish.ejs', {score, totalQuestions});
})



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})