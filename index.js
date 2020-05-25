'use strict';

const express = require('express');
const lineNotify = require('line-notify-nodejs')('bBQfnY7p3rBh5K70WpMwLU8fCKAapKcdkkoR9cGrSqA');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const app = express();

const port = 8080;

app.use(bodyParser.json({ type: 'application/json' }))

app.post('/pushed', (req, res) => {
	const { body } = req;

	if (!('repository' in body) ||
	    !('git_url' in body.repository) ||
	    !('after' in body) ||
	    !('ref' in body)) {
		res.json({success: false});
		return;
	}

	console.log(body.repository['git_url']);
	console.log(body.after);
	console.log(body.ref);

	const repo = body.repository['git_url'];
	const hash = body.after;
	const branch = body.ref;

	if (branch !== 'refs/heads/master') {
		res.json({success: false});
                return;
	}

	const deploy = exec(`./deploy ${repo} ${hash} hikoo-frontend`, (err, stdout, stderr) => {
		if (err) {
			console.error(err);
			lineNotify.notify({message: `Deploy ${repo} ${hash} failed with message ${err.message}`}).then(console.log).catch(console.log);
			return;
		}
	});

	deploy.on('exit', code => {
		if (code !== 0) {
			lineNotify.notify({message: `Deploy ${repo} ${hash} failed with code ${code}`}).then(console.log).catch(console.log);
			console.error(`Deploy failed with code ${code}`);
			return;
		}

		lineNotify.notify({message: `Deploy ${repo} ${hash} success`}).then(console.log).catch(console.log);
		console.log(`Deploy ${hash} success`);
	});

	res.json({success: true});
});

app.listen(port, '0.0.0.0', () => console.log(`Webhook listening on port ${port}`))
