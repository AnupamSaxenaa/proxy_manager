const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireNetwork } = require('../middleware/network');
const { registerFace, getFaceStatus, verifyFace, resetFace } = require('../controllers/faceController');

const router = express.Router();

router.post('/register', authenticate, registerFace);
router.get('/status', authenticate, getFaceStatus);
router.post('/verify', authenticate, requireNetwork, verifyFace);
router.delete('/reset', authenticate, resetFace);
router.delete('/reset/:userId', authenticate, resetFace);

router.get('/network-check', authenticate, (req, res) => {
    const allowedNetworks = (process.env.ALLOWED_NETWORKS || '').split(',').filter(Boolean);
    const clientIp = (req.ip || req.connection.remoteAddress || '').replace('::ffff:', '');
    const isLocal = ['127.0.0.1', '::1', 'localhost'].includes(clientIp);

    if (allowedNetworks.length === 0 || isLocal) {
        return res.json({
            allowed: true,
            ip: clientIp,
            message: allowedNetworks.length === 0
                ? 'No network restriction configured (development mode).'
                : 'Connected from localhost.',
        });
    }

    const { requireNetwork: checkNetwork } = require('../middleware/network');
    const testReq = { ip: req.ip, connection: req.connection };
    const testRes = {
        status: () => ({ json: () => { } }),
    };
    let allowed = false;
    checkNetwork(testReq, testRes, () => { allowed = true; });

    res.json({
        allowed,
        ip: clientIp,
        required_networks: allowedNetworks,
        message: allowed
            ? 'You are on the allowed network.'
            : 'You are NOT on the college network. Connect to the college WiFi to mark attendance.',
    });
});

module.exports = router;
