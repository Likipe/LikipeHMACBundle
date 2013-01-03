<?php

namespace Likipe\HMACBundle\Security\Authentication\Token;

use Symfony\Component\Security\Core\Authentication\Token\AbstractToken;

class HMACToken extends AbstractToken
{
	public $id;
	public $reqStr;
	public $hmac;
	
	public function getCredentials()
	{
		return '';
	}
}