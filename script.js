const puppeteer=require('puppeteer')
//Enter the link below which u want to analyse
let url="https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq";
let page;
let cvideos=0;
async function fn(){
    try{
        //launching browser
        let browser=await puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:["--start-maximized"]
        });
        let pagesArr=await browser.pages();
        page=pagesArr[0];
        //goto page
        await page.goto(url);
        //Getting the stats
        await page.waitForSelector("#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer",{visible:true})
        await page.waitForSelector("h1#title",{visible:true})
        let {noofvideos,views,Title}=await page.evaluate(function(){
            let array= document.querySelectorAll("#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer");
            noofvideos= array[0].innerText;
            views=array[1].innerText;
            Title=document.querySelector("h1#title").innerText;
            return {noofvideos,views,Title}
        })
        console.log("Title:",Title);
        console.log("Views:",views);
        console.log("Total Videos:",noofvideos);
        //loop for infinite scroll
        noofvideos=noofvideos.split(" ")[0];
        noofvideos=Number(noofvideos);
        let i=0;
        while ((noofvideos-cvideos)>100) {
            await scrollDown(page);
            i++;
        }
        //last scroll till html is rendered
        await waitTillHTMLRendered(page);
        await scrollDown()
        console.log("Actual Videos",cvideos);
        let videoSelector = "#video-title";
        let duration = "span.style-scope.ytd-thumbnail-overlay-time-status-renderer";
        let titleDurArr = await page.evaluate(getTitleNDuration, videoSelector, duration);
        //console the table
        console.table(titleDurArr);
        await browser.close();   
    }catch(err){
        console.log(err);
    }
}
//scrool down function
async function scrollDown(){
    let length=await page.evaluate(function(){
        //getting all elements
        let titleElem=document.querySelectorAll("#video-title");
        //last element come into scrollview
        titleElem[titleElem.length-1].scrollIntoView(true);
        return titleElem.length;
    })
    cvideos=length;
}
//get the details of name and duration of videos
function getTitleNDuration(videoSelector,duration){
    let titleElementsArr=document.querySelectorAll(videoSelector);
  let durationElementArr=document.querySelectorAll(duration);
    let titleDurArr=[];
    for(let i=0;i<durationElementArr.length;i++){
        let title=titleElementsArr[i].innerText.trim();
       let duration=durationElementArr[i].innerText.trim();
        titleDurArr.push({title,duration})
    }
    return titleDurArr;
}
//html rendered code
async function waitTillHTMLRendered(page,timeout=30000){
    const checkDurationMsecs=1000;
    const maxChecks=timeout/checkDurationMsecs;
    let lastHTMLSize=0;
    let checkCounts=1;
    let countStableSizeIterations=0;
    const minStableSizeIterations=3;
    while(checkCounts++<=maxChecks){
        let html=await page.content();
        let currentHTMLSize=html.length;
        let bodyHTMLSize=await page.evaluate(function(){
            return document.body.innerHTML.length;
        })
        if(lastHTMLSize!=0 && currentHTMLSize==lastHTMLSize)
            {countStableSizeIterations++;}
        else countStableSizeIterations=0;
        if(countStableSizeIterations>=minStableSizeIterations){
            console.log("Page Rendered");
            break;
        }
        lastHTMLSize=currentHTMLSize;
        await page.waitForTimeout(checkDurationMsecs)
    }
}
fn();