<?php

namespace Likipe\HMACBundle\NonceValidator;

use Likipe\HMACBundle\NonceValidatorInterface;

class DummyNonceValidator implements NonceValidatorInterface
{
	public function isValid($macId, $nonce)
	{
		return true;
	}
}
