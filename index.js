const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const fetch = require('node-fetch')
const fs = require('fs')
const {promisify} = require('util')
const mkdir = promisify(fs.mkdir)
const exists = promisify(fs.access)
const {exec} = require('child_process');
const token = fs.readFileSync('token.txt')
const telegram = new Telegram(token, {agent: null})
const jumpCutter = new Telegraf(token, {agent: null})



jumpCutter.command('start', ctx => {
	ctx.reply('test')
})

jumpCutter.on('voice', async (ctx) => {
	const file = (await telegram.getFile(ctx.message.voice.file_id))
	const folder = file.file_id
	const fileName = file.file_path.split('/').slice(-1);
	
	const parentFolder = 'voices'
	const voiceFolder = `${parentFolder}/${folder}`
	const inputFile = `${voiceFolder}/${fileName}`
	const outputFile = `${voiceFolder}/resultVoice.oga`;
	const tempFolder = `${voiceFolder}/TEMP`
	
	const parentFolderExists = await new Promise((res, rej) => fs.access(parentFolder, fs.constants.R_OK, err => err ? res(false) : res(true)))
	if(!parentFolderExists)
		await mkdir(parentFolder)
	
	const folderExists = await new Promise((res, rej) => fs.access(voiceFolder, fs.constants.R_OK, err => err ? res(false) : res(true)))
	const fileExists = await new Promise((res, rej) => fs.access(outputFile, fs.constants.R_OK, err => err ? res(false) : res(true)))
	if(folderExists && fileExists)
		return await new Promise(async (res, rej) => {
			exec(`ffmpeg -i ${outputFile} 2>&1 | grep Duration | cut -d ' ' -f 4 | sed s/,//`, async (err, stdout, stderr) => {
				let t = stdout.split('\n')[0].split('.')
				let time = t[0].split(':').reduce((sum, val, i) => sum += parseInt(val) * 60**(2-i), parseInt(t.pop())/100)
				await ctx.replyWithVoice({
					source: outputFile
				},{
					duration: time,
					reply_to_message_id: ctx.message.message_id
				})
				await exec(`rm -rf ./${voiceFolder}`)
				res()
			})
		})
	else if(folderExists && !fileExists)
		return await new Promise(async (res, rej) => {
			await exec(`rm -rf ./${voiceFolder}`)
			res()
		})
			
	
	
	await mkdir(voiceFolder)
	
	const download = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`)
	const fileStream = fs.createWriteStream(inputFile);
	let write = await new Promise((res, erj) => {
		download.body.pipe(fileStream);
		download.body.on("error", e => res(e));
		fileStream.on("finish", e => res(true));
	});
	
	let cutRes = await new Promise((res, rej) => {
		exec(`python36 jumpcutter.py --output_file ${outputFile} --input_file ${inputFile} --temp_folder ${tempFolder}`, (err, stdout, stderr) => {
			if(err)
				console.error(err), res({err})
			else
				res(stdout)
		});
	})
	if(typeof cutRes === 'object')
		return ctx.reply('Ошибка: ' + cutRes.err)
	
	let t = cutRes.split('\n')[0].split('.')
	let time = t[0].split(':').reduce((sum, val, i) => sum += parseInt(val) * 60**(2-i), parseInt(t.pop())/100)
	await ctx.replyWithVoice({
		source: outputFile
	},{
		duration: time,
		reply_to_message_id: ctx.message.message_id
	})
	await exec(`rm -rf ./${voiceFolder}`)
})
jumpCutter.startPolling()